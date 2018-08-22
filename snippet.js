document.getElementsByTagName("BODY")[0].style.display = "none";

// Host
let host;

// Product ID's
let ids;

// Client data
let grant_type;

// Token
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
        document.write(
            "<div id='alternative-checkout'>" +

            "<p>Alternative Checkout:</p>" +

            "<p>" +
            productName +
            "</p>" +

            "<p>" +
            price.totalPrice + "€" +
            "</p>" +

            "<input id='alternative-name' type='text' name='Name' placeholder='Name'><br>" +

            "<input id='alternative-email' type='email' name='Email' placeholder='Email'><br>" +

            "<select>" +
            "<option id='alternative-country' value='DE'>Germany</option>\n" +
            "</select><br>" +

            "<input id='alternative-address' type='text' name='Address' placeholder='Address'><br>" +

            "<input id='alternative-postCode' type='text' name='PostCode' placeholder='Post code'><br>" +

            "<input id='alternative-city' type='text' name='City' placeholder='City'><br>" +

            "<button id='alternative-buy'>Buy</button>" +

            "</div>"
        );

        let myElements = document.querySelector("#alternative-checkout");
        myElements.style.border = "solid black";
        myElements.style.textAlign = "center";
        myElements.style.verticalAlign = "middle";

        document.getElementById('alternative-buy').onclick = function () {
            let data = {
                payerEmail: document.getElementById('alternative-email').value,
                details: {
                    billingAddress: {
                        addressLine: [document.getElementById('alternative-address').value],
                        city: document.getElementById('alternative-city').value,
                        postalCode: document.getElementById('alternative-postCode').value,
                        recipient: document.getElementById('alternative-name').value
                    }
                },
                shippingAddress: {
                    country: document.getElementById('alternative-country').value
                }
            };
            guestOrder(data);
        }
    }
}

function guestOrder(customer){
    let name = splitName(customer.details.billingAddress.recipient);
    let data;

    apiAuth().then(function(result){
        if(result){
            getCountryId(customer.shippingAddress.country, result).then(function(result){
                let countryId = result;

                if(name.length > 1){
                    data = JSON.stringify({
                        firstName: name[0],
                        lastName: name[name.length-1],
                        email: customer.payerEmail,
                        billingCountry: countryId,
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
                        billingCountry: countryId,
                        billingZipcode: customer.details.billingAddress.postalCode,
                        billingCity: customer.details.billingAddress.city,
                        billingStreet: customer.details.billingAddress.addressLine[0]
                    });
                }

                let xhr = new XMLHttpRequest();

                xhr.addEventListener("readystatechange", function(){
                    if(this.readyState === 4){
                        let obj = JSON.parse(this.responseText);
                        alert("Thank you for your order, " + obj.data.billingAddress.lastName + "!\nYour goods will be delivered to: " + obj.data.billingAddress.street);
                    }
                });

                xhr.open("POST", host + "/storefront-api/checkout/guest-order");
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("X-SW-Context-Token", contextToken);
                xhr.setRequestHeader("X-SW-Access-Key", accessToken);

                xhr.send(data);
            });
        }
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
                selected: true,
            }
        );
    }
    return shippingOptions;
}

function getCountryId(iso, bearerToken){
    return new Promise((resolve) => {
        let data = null;
        let countryId = null;

        let xhr = new XMLHttpRequest();

        xhr.addEventListener("readystatechange", function(){
            if(this.readyState === 4){
                let countries = JSON.parse(this.responseText).data;
                for(let i = 0; i < countries.length; i++){
                    if(iso === countries[i].attributes.iso){
                        countryId = countries[i].id;
                        resolve(countryId);
                    }
                }
            }
        });

        xhr.open("GET", host + "/api/v1/country");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Authorization", bearerToken);
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
        document.getElementById(id.descriptionSelector).innerHTML = obj.data.attributes.description;
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

    document.getElementsByTagName("BODY")[0].style.display = "block";
}

function apiAuth(){
    return new Promise((resolve) => {
        let data = JSON.stringify({
            "client_id": "SWIAEGTMT3JQNGNZEGDRNWRLBG",
            "client_secret": "dGhISUFFUWJPV1k4TG45MjFlcGhGNkRkQURTTWxiUzhpWGZiNWI",
            "grant_type": grant_type
        });

        let xhr = new XMLHttpRequest();

        xhr.addEventListener("readystatechange", function(){
            if(this.readyState === 4) {
                resolve(JSON.parse(this.responseText).access_token);
            }
        });

        xhr.open("POST", host + "/api/oauth/token");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("X-SW-Context-Token", contextToken);
        xhr.setRequestHeader("X-SW-Access-Key", accessToken);

        xhr.send(data);
    });
}
