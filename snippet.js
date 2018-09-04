let host;

let grant_type;

let ids;

let accessToken;
let contextToken;

init();

function init(){
    host = configuration.host;

    accessToken = configuration.access_token;
    grant_type = configuration.grant_type;

    ids = products.slice();

    for(let i = 0; i < ids.length; i++){
        query(ids[i]);
    }
}

function query(id){
    let data = null;

    let xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function(){
        if(this.readyState === 4) {
            let obj = JSON.parse(this.responseText);
            useConfig(obj, id);
        }
    });

    xhr.open("GET", host + "/storefront-api/product/" + id.uuid);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("X-SW-Access-Key", accessToken);

    xhr.send(data);
}

function createCart(id){
    let data = null;

    let xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function(){
       if(this.readyState === 4){
           contextToken = JSON.parse(this.responseText)['x-sw-context-token'];
           addItemToCart(id);
       }
    });

    xhr.open("POST", host + "/storefront-api/checkout/cart");
    xhr.setRequestHeader("X-SW-Access-Key", accessToken);

    xhr.send(data);
}

function addItemToCart(id){
    let data = JSON.stringify({
        "type": "product",
        "quantity": 1,
        "payload": {
            "id": id
        }
    });

    let xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function(){
        if(this.readyState === 4){
            let data = JSON.parse(this.responseText).data;
            paymentRequest(data);
        }
    });

    xhr.open("POST", host + "/storefront-api/checkout/cart/line-item/" + id);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("X-SW-Context-Token", contextToken);
    xhr.setRequestHeader("X-SW-Access-Key", accessToken);

    xhr.send(data);
}

function paymentRequest(data){
    let productName = data.lineItems[0].label;
    let price = data.price;
    let shipping = data.deliveries;

    if(window.PaymentRequest) {
        const supportedPaymentMethods = [
            {
                supportedMethods: 'basic-card',
                data: {
                    supportedNetworks: ["visa", "mastercard", "amex"],
                    supportedTypes: ["debit", "credit"]
                }
            }
        ];

        const paymentDetails = {
            displayItems: [
                {
                    label: productName,
                    amount: {
                        currency: 'EUR',
                        value: price.netPrice
                    }
                },
                {
                    label: "VAT",
                    amount: {
                        currency: "EUR",
                        value: price.calculatedTaxes[0].tax
                    }
                }
            ],
            shippingOptions: getShippingOptions(shipping),
            total: {
                label: "Total",
                amount:{
                    currency: 'EUR',
                    value: price.totalPrice
                }
            }
        };

        const options = {
            requestPayerEmail: true,
            requestShipping: true,
        };

        const paymentRequest = new PaymentRequest(
            supportedPaymentMethods,
            paymentDetails,
            options
        );

        return paymentRequest.show()
            .then(paymentResponse => {
                data = paymentResponse;
                guestOrder(data);

                return paymentResponse.complete();
            })
            .catch(err => console.error(err));
    } else {
        if(document.getElementById("popup").style.display === "block") {
            document.getElementById("popup").style.display = "none";
        }
        else {
            document.getElementById("popup").style.display = "block";
        }

        document.getElementById('alternative-buy-button').onclick = function () {
            let data = {
                payerEmail: document.getElementById('alternative-email').value,
                details: {
                    billingAddress: {
                        addressLine: [document.getElementById('alternative-address').value],
                        city: document.getElementById('alternative-city').value,
                        postalCode: document.getElementById('alternative-postcode').value,
                        recipient: document.getElementById('alternative-first-name').value + " " + document.getElementById('alternative-last-name').value
                    }
                },
                shippingAddress: {
                    country: document.getElementById('alternative-country').value
                }
            };
            guestOrder(data);
            document.getElementById("popup").style.display = "none";
        }
    }
}

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function guestOrder(customer){
    let name = splitName(customer.details.billingAddress.recipient);
    let data;

    getCountryId(customer.shippingAddress.country).then(function (result) {
        if (name.length > 1) {
            data = JSON.stringify({
                firstName: name[0],
                lastName: name[name.length - 1],
                email: customer.payerEmail,
                billingCountry: result,
                billingZipcode: customer.details.billingAddress.postalCode,
                billingCity: customer.details.billingAddress.city,
                billingStreet: customer.details.billingAddress.addressLine[0]
            });
        }

        else {
            data = JSON.stringify({
                firstName: "Without first name",
                lastName: name[0],
                email: customer.payerEmail,
                billingCountry: result,
                billingZipcode: customer.details.billingAddress.postalCode,
                billingCity: customer.details.billingAddress.city,
                billingStreet: customer.details.billingAddress.addressLine[0]
            });
        }

        let xhr = new XMLHttpRequest();

        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
                let obj = JSON.parse(this.responseText);
                alert("Thank you for your order, " + obj.data.billingAddress.lastName + "!\nYour goods will be delivered to: " + obj.data.billingAddress.street);
                init();
            }
        });

        xhr.open("POST", host + "/storefront-api/checkout/guest-order");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("X-SW-Context-Token", contextToken);
        xhr.setRequestHeader("X-SW-Access-Key", accessToken);

        xhr.send(data);
    });
}

function getImageByType(data, type){
    return data.included
        .filter((item) => {
            return item.type === type;
        }).map((item) => {
            return item.attributes.extensions;
        })[0].links.url;
}

function splitName(fullName){
    return fullName.split(" ");
}

function getShippingOptions(shipping){
    let shippingOptions = [];

    for(let i = 0; i < shipping.length; i++){
        shippingOptions.push(
            {
                id: shipping[i].shippingMethod.id,
                label: shipping[i].shippingMethod.name,
                amount:{
                    currency: 'EUR',
                    value: shipping[i].shippingCosts.totalPrice
                },
                selected: true
            }
        );
    }
    return shippingOptions;
}

function getCountryId(iso){
    return new Promise((resolve) => {
        let data = null;
        let countryId = null;

        let xhr = new XMLHttpRequest();

        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
                let countries = JSON.parse(this.responseText).data;

                for (let i = 0; i < countries.length; i++) {
                    if (iso === countries[i].attributes.iso) {
                        countryId = countries[i].id;
                        resolve(countryId);
                    }
                }
            }
        });

        xhr.open("GET", host + "/storefront-api/sales-channel/countries");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("X-SW-Context-Token", contextToken);
        xhr.setRequestHeader("X-SW-Access-Key", accessToken);

        xhr.send(data);
    });
}

function useConfig(obj, id){
    if(id.titleSelector){
        document.getElementById(id.titleSelector).innerHTML = obj.data.attributes.name;
    }

    if(id.descriptionSelector){
        document.getElementById(id.descriptionSelector).innerHTML = obj.data.attributes.description; //long
    }

    if(id.priceSelector){
        document.getElementById(id.priceSelector).innerHTML = obj.data.attributes.price.gross + " €";
    }

    if(id.imageSelector){
        document.getElementById(id.imageSelector).src = getImageByType(obj, 'media');
    }

    if(id.buttonSelector){
        document.getElementById(id.buttonSelector).addEventListener("click", function(){
            createCart(id.uuid);
        });
    }

    addAlternativeCheckout(id);
}

function getCheckoutContent(){
    return new Promise((resolve) => {
        let xhr = new XMLHttpRequest();

        xhr.addEventListener("readystatechange", function(){
            if(this.readyState === 4) {
                resolve(this.responseText);
            }
        });

        xhr.open("GET", "/alternative-checkout.html");

        xhr.send();
    });
}

function addAlternativeCheckout(id){
    let buyButton = document.getElementById(id.buttonSelector);

    getCheckoutContent().then(function (result) {
        let div = document.createElement('div');
            div.innerHTML = result;

        let button = div.getElementsByTagName('button');
            button[0].setAttribute("id", "alternative-buy-button");

        let popup = div.getElementsByClassName('shopware-popup');
            popup[0].setAttribute("id", "popup");
            popup[0].style.display = "none";

        insertAfter(div, buyButton);
    });
}

function getCurrencies(){
    let data = null;

    let xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === 4) {
            console.log(JSON.parse(this.responseText));
            return this.responseText;
        }
    });

    xhr.open("GET", host + "/storefront-api/sales-channel/currencies");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("X-SW-Context-Token", contextToken);
    xhr.setRequestHeader("X-SW-Access-Key", accessToken);

    xhr.send(data);
}
