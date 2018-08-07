// Host
let host = document.getElementById('id').dataset.host;

// Product ID
let id = document.getElementById('id').dataset.uuid;

let client_id = document.getElementById('id').dataset.client_id;
let client_secret = document.getElementById('id').dataset.client_secret;
let grant_type = document.getElementById('id').dataset.grant_type;

// Token
let accessToken;
let contextToken;

connect();

// Language
document.write(
    "<select id='languages' onchange='setLanguage(this)'>" +
        "<option id='german' value='de'>Deutsch</option>" +
        "<option id='english' value='en'>Englisch</option>" +
    "</select>"
);

// Product data
document.write(
    "<div id='product'>"+
        "<h2 id='productTitle'></h2>" +
        "<p id='productDescription'></p>" +
        "<img id='productImage'>" +
        "<h3 id='productPrice'></h3>" +
        "<h4 id='productStock'></h4>" +
        "<p id='productsInCart'></p>" +
        "<p id='total'></p>" +
    "</div>"
);

// Purchase form
let down = false;

document.write(
    "<div id='purchaseForm'>" +
        "<button id='buyNow' onclick='buy()'>Jetzt kaufen</button>" +

        "<div id='showForm'>" +

            "<p id='usernameText'>Benutzername: </p><input id='username' type='text' placeholder='Username'><br>" +
            "<p id='passwordText'>Passwort: </p><input id='password' type='password' placeholder='Password'>" +

            /*"<p id='payWith'>Bezahle mit: </p>" +

            "<select>" +
                "<option id='paypal' value='paypal'>PayPal</option>" +
                "<option id='directly' value='directly'>Sofort</option>" +
                "<option id='paymentInAdvance' value='paymentInAdvance'>Vorkasse</option>" +
            "</select>" +*/

            "<br><br><button id='confirm' value='confirm' onclick='customerLogin(getUsername(), getUserPassword())'>Best&auml;tigen</button>" +

        "</div>"
);

document.write(
    "<div id='billingAddress'>" +
        "<p id='customerThank'></p>" +
        "<p id='customerDates'></p>" +
        "<p id='customerName'></p>" +
        "<p id='customerStreetName'></p>" +
        "<p id='customerAddress'></p>" +
        "<p id='customerCountry'></p>" +
    "</div>"
);

let firstClick = false;

function buy() {
    if(!firstClick){
        addItemToCart(1);
        firstClick = true;
    }
    if(!down)
    {
        document.getElementById("showForm").style.display = "block";
        down = true;

    } else {
        document.getElementById("showForm").style.display = "none";
        down = false;
    }
}

function connect() {
    let data = JSON.stringify({
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": grant_type
    });

    let xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function () {
        if(this.readyState === 4) {
            accessToken = JSON.parse(this.responseText).access_token;
            query();
            createCart();
            readCart();
        }
    });

    xhr.open("POST", host + "/storefront-api/oauth/token");
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.send(data);
}

function query() {
    let data = null;

    let xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function () {
        if(this.readyState === 4) {
            let obj = JSON.parse(this.responseText);
            document.getElementById('productTitle').innerHTML = obj.data.attributes.name;
            document.getElementById('productDescription').innerHTML = obj.data.attributes.description;
            document.getElementById('productPrice').innerHTML = obj.data.attributes.price.gross + " €";
            getStockInfo(obj);

            document.getElementById('productImage').src = getImageByType(obj, 'media');
        }
    });

    xhr.open("GET", host + "/storefront-api/product/" + id);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", accessToken);

    xhr.send(data);
}

function createCart(){
    let data = null;

    let xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function(){
       if(this.readyState === 4){
           contextToken = JSON.parse(this.responseText)['x-sw-context-token'];
       }
    });

    xhr.open("POST", host + "/storefront-api/checkout/cart");
    xhr.setRequestHeader("Authorization", accessToken);

    if (contextToken) {
        xhr.setRequestHeader("x-sw-context-token", contextToken);
    }

    xhr.send(data);
}

function readCart(){
    let data = null;

    let xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function(){
        if(this.readyState === 4){
            let obj = JSON.parse(this.responseText);
            document.getElementById('productsInCart').innerHTML = "Artikelanzahl im Warenkorb: " + obj.data.lineItems.length + "";
            document.getElementById('total').innerHTML = "Gesamtbetrag: " + obj.data.price.totalPrice + "€";
        }
    });

    xhr.open("GET", host + "/storefront-api/checkout/cart");
    xhr.setRequestHeader("Authorization", accessToken);
    xhr.setRequestHeader("x-sw-context-token", contextToken);

    xhr.send(data);
}

function addItemToCart(quantity){
    let data = JSON.stringify({
        "type": "product",
        "quantity": quantity,
        "payload": {
            "id": id
        }
    });

    let xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function(){
        if(this.readyState === 4){
            console.log(JSON.parse(this.responseText));
            readCart();
            let data = JSON.parse(this.responseText).data;

            paymentRequest(data); // Google payment request API
        }
    });

    xhr.open("POST", host + "/storefront-api/checkout/cart/line-item/" + id);
    xhr.setRequestHeader("x-sw-context-token", contextToken);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", accessToken);

    xhr.send(data);
}

function changeItemQuantity(quantity){
    let data = null;

    let xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function(){
        if(this.readyState === 4){
            console.log(this.responseText)
        }
    });

    xhr.open("PATCH", host + "/storefront-api/checkout/cart/line-item/" + id + "/quantity/" + quantity);
    xhr.setRequestHeader("x-sw-context-token", contextToken);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", accessToken);

    xhr.send(data);
}

function customerLogin(username, password){
    let data = JSON.stringify({
        "username": username,
        "password": password
    });

    let xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function(){
        if(this.readyState === 4){
            order();
        }
    });

    xhr.open("POST", host + "/storefront-api/customer/login");
    xhr.setRequestHeader("x-sw-context-token", contextToken);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", accessToken);

    xhr.send(data);
}

function order(){
    let data = null;

    let xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function(){
        if(this.readyState === 4){
            console.log(this.responseText);
            successfulOrder(JSON.parse(this.responseText));
            readCart();
            document.getElementById('billingAddress').style.display = "block";
        }
    });

    xhr.open("POST", host + "/storefront-api/checkout/order");
    xhr.setRequestHeader("x-sw-context-token", contextToken);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", accessToken);

    xhr.send(data);
}

function getStockInfo(obj){
    let stock = parseInt(obj.data.attributes.stock);
    if(stock > 10){
        document.getElementById('productStock').innerHTML = "Auf Lager!";
    }
    else if(stock <= 10){
        document.getElementById('productStock').innerHTML = "Nur noch wenige auf Lager! [" + stock + "]";
    }
    else if(stock <= 0){
        document.getElementById('productStock').innerHTML = "Leider nicht mehr auf Lager!";
    }
    else{
        document.getElementById('productStock').innerHTML = "Leider gibt es keine weiteren Informationen über den Bestand :(";
    }
}

function getImageByType(data, type) {
    return data.included
        .filter((item) => {
            return item.type === type;
        }).map((item) => {
            return item.attributes;
        })[0].links.url;
}

function getUsername(){
    return document.getElementById('username').value;
}

function getUserPassword(){
    return document.getElementById('password').value;
}

function successfulOrder(response){
    if(response.data){
        console.log(response);
        let billingAddress = response.data.billingAddress;

        document.getElementById('customerThank').innerHTML = "Vielen Dank f&uuml;r Ihre Bestellung!";
        document.getElementById('customerDates').innerHTML = "Ihre Daten:";

        document.getElementById('customerName').innerHTML = billingAddress.salutation + " " + billingAddress.firstName + " " + billingAddress.lastName;
        document.getElementById('customerStreetName').innerHTML = billingAddress.street;
        document.getElementById('customerAddress').innerHTML = billingAddress.zipcode + " " + billingAddress.city;
        document.getElementById('customerCountry').innerHTML = billingAddress.country.name;
    }
    else if(response.errors){
        console.log("test");
    }
}

function setLanguage(id){
    let language = id.value;

    if(language === "de"){
        document.getElementById('german').innerHTML = "Deutsch";
        document.getElementById('english').innerHTML = "Englisch";

        document.getElementById('buyNow').innerHTML = "Jetzt kaufen";

        document.getElementById('usernameText').innerHTML = "Benutzername:";
        document.getElementById('passwordText').innerHTML = "Passwort:";

        document.getElementById('payWith').innerHTML = "Bezahle mit:";
        document.getElementById('paypal').innerHTML = "PayPal";
        document.getElementById('directly').innerHTML = "Sofort";
        document.getElementById('paymentinadvance').innerHTML = "Vorkasse";
        document.getElementById('paymentinadvance').innerHTML = "Vorkasse";
        document.getElementById('confirm').innerHTML = "Best&aumltigen";

        document.getElementById('productsInCart').innerHTML = "Artikelanzahl im Warenkorb:";
        document.getElementById('total').innerHTML = "Gesamtbetrag:";
    }

    else if(language === "en")
    {
        document.getElementById('german').innerHTML = "German";
        document.getElementById('english').innerHTML = "English";

        document.getElementById('buyNow').innerHTML = "Buy now";

        document.getElementById('usernameText').innerHTML = "Username:";
        document.getElementById('passwordText').innerHTML = "Password:";

        document.getElementById('payWith').innerHTML = "Pay with:";
        document.getElementById('paypal').innerHTML = "PayPal";
        document.getElementById('directly').innerHTML = "Directly";
        document.getElementById('paymentInAdvance').innerHTML = "Payment in advance";
        document.getElementById('confirm').innerHTML = "Confirm";

        document.getElementById('productsInCart').innerHTML = "Product number in the Cart:";
        document.getElementById('total').innerHTML = "Total amount:";
    }
}

function paymentRequest(data){
    let productName = data.lineItems[0].label;
    let price = data.price;
    let shipping = data.deliveries[0];

    if(window.PaymentRequest) {
        // Die zur Verfügung stehende Bezahlmethoden
        const supportedPaymentMethods = [
            {
                supportedMethods: 'basic-card',
                data: {
                    supportedNetworks: ["visa", "mastercard"],
                    supportedTypes: ["debit", "credit"],
                },
            },
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
                    label: "MwSt",
                    amount: {
                        currency: "EUR",
                        value: price.calculatedTaxes[0].tax
                    }
                }
            ],
            shippingOptions: [
                {
                    id: "standart",
                    label: shipping.shippingMethod.name,
                    amount:{
                        currency: 'EUR',
                        value: shipping.shippingCosts.totalPrice
                    },
                    selected: true,
                }
            ],
            total: {
                label: "Gesamtpreis",
                amount:{
                    currency: 'EUR',
                    value: price.totalPrice
                }

            }
        };

        //Object.assign(paymentDetails, { shippingOptions });

        // Konfiguration der Pflichtangaben
        const options = {
            requestPayerEmail: true,
            requestPayerName: true,
            requestShipping: true,
        };

        //new PaymentRequest(supportedPaymentMethods, paymentDetails, options);

        const request = new PaymentRequest(
            supportedPaymentMethods,
            paymentDetails,
            options
        );

        // Call when you wish to show the UI to the user.
        request.show()
            .then((paymentResponse) => {
                // Zugriff auf die vom Nutzer
                // eingegebenen Daten.
                const {
                    requestId,
                    methodName,
                    details,
                    shipping,
                    shippingOption,
                    payerName,
                    payerEmail,
                    payerPhone
                } = paymentResponse;
                // verify() als imaginäre Funktion, mit der
                // die Bezahlanfrage mit der Serverseite überprüft wird
                verify(paymentResponse).then((success) => {
                    if (success) {
                        console.log('Bezahlung erfolgreich durchgeführt');
                        return paymentResponse.complete('success');
                    } else {
                        console.error('Fehler bei Bezahlung');
                        return paymentResponse.complete('failure');
                    }
                });
            })
            .catch((error) => {
                console.error('Fehler:', error);
            });

        //new PaymentRequest(supportedPaymentMethods, paymentDetails, options);

    } else {
        // Fallback to traditional checkout
        window.location.href = '/checkout/traditional';
    }
}
