let host;

let ids;

let accessToken;
let contextToken;

const requiredState = 4;

let languageSnippets;

init();

function init() {
    loadLanguageSnippets();

    if (configuration.host) {
        host = configuration.host;
    }

    if (configuration.access_token) {
        accessToken = configuration.access_token;
    }

    if (configuration.products) {
        ids = configuration.products.slice();

        for (let i = 0; i < ids.length; i++) {
            productDataQuery(ids[i]);
        }
    }
}

function registerEvents() {

}

function readyStateChange() {
    let xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === requiredState) {

        }
    });
}

function productDataQuery(id) {
    let data = null;

    let xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === requiredState) {
            let obj = JSON.parse(this.responseText);
            loadSelectors(obj, id);
        }
    });

    xhr.open("GET", host + "/storefront-api/product/" + id.uuid);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("X-SW-Access-Key", accessToken);

    xhr.send(data);
}

function createShoppingCart(id) {
    let data = null;

    let xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === requiredState) {
            contextToken = JSON.parse(this.responseText)['x-sw-context-token'];
            addItemToCart(id);
        }
    });

    xhr.open("POST", host + "/storefront-api/checkout/cart");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("X-SW-Access-Key", accessToken);

    xhr.send(data);
}

function addItemToCart(id) {
    let data = JSON.stringify({
        "type": "product",
        "quantity": 1,
        "payload": {
            "id": id
        }
    });

    let xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === requiredState) {
            let data = JSON.parse(this.responseText).data;
            showPaymentRequest(data);
        }
    });

    xhr.open("POST", host + "/storefront-api/checkout/cart/line-item/" + id);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("X-SW-Context-Token", contextToken);
    xhr.setRequestHeader("X-SW-Access-Key", accessToken);

    xhr.send(data);
}

function showPaymentRequest(productData) {
    if (!window.PaymentRequest) {
        if (document.getElementById("popup")) {
            let popup = document.getElementById("popup");
            popup.parentNode.removeChild(popup);
        }

        let id;
        let productId = JSON.stringify(productData.lineItems[0].key);

        for (let i = 0; i < ids.length; i++) {
            if (JSON.stringify(ids[i].uuid) === productId) {
                id = JSON.stringify(ids[i]);
            }
        }

        addAlternativeCheckout(id);
    }

    usePaymentRequestApi(productData);
}

function usePaymentRequestApi(data) {
    let productName = data.lineItems[0].label;
    let price = data.price;
    let shipping = data.deliveries;

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
                    currency: configuration.currency[0].type,
                    value: price.netPrice
                }
            },
            {
                label: getLanguageSnippet("vat"),
                amount: {
                    currency: configuration.currency[0].type,
                    value: price.calculatedTaxes[0].tax
                }
            }
        ],
        shippingOptions: getShippingOptions(shipping),
        total: {
            label: getLanguageSnippet("total"),
            amount: {
                currency: configuration.currency[0].type,
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
}

function insertElementAfterTarget(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function guestOrder(customer) {
    let name = splitName(customer.details.billingAddress.recipient);
    let data;

    getCountryId(customer.shippingAddress.country).then(function (result) {
        data = {
            firstName: getLanguageSnippet("withoutFirstName"),
            lastName: name[name.length - 1],
            email: customer.payerEmail,
            billingCountry: result,
            billingZipcode: customer.details.billingAddress.postalCode,
            billingCity: customer.details.billingAddress.city,
            billingStreet: customer.details.billingAddress.addressLine[0]
        };

        if (name.length > 1) {
            data.firstName = name[0];
        }

        data = JSON.stringify(data);

        let xhr = new XMLHttpRequest();

        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === requiredState) {
                let obj = JSON.parse(this.responseText);
                alert(getLanguageSnippet("thankYouForYourOrder") + "\n" + getLanguageSnippet("yourGoodsWillBeDeliveredTo") + obj.data.billingAddress.street);
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

function splitName(fullName) {
    return fullName.split(" ");
}

function getShippingOptions(shipping) {
    let shippingOptions = [];

    for (let i = 0; i < shipping.length; i++) {
        shippingOptions.push(
            {
                id: shipping[i].shippingMethod.id,
                label: shipping[i].shippingMethod.name,
                amount: {
                    currency: configuration.currency[0].type,
                    value: shipping[i].shippingCosts.totalPrice
                },
                selected: true
            }
        );
    }
    return shippingOptions;
}

function getCountryId(iso) {
    return new Promise((resolve) => {
        let data = null;
        let countryId = null;

        let xhr = new XMLHttpRequest();

        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === requiredState) {
                let countries = JSON.parse(this.responseText).data;

                for (let i = 0; i < countries.length; i++) {
                    if (iso === countries[i].iso) {
                        countryId = countries[i].id;
                        resolve(countryId);
                    }
                }
            }
        });

        xhr.open("GET", host + "/storefront-api/sales-channel/countries");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("X-SW-Context-Token", contextToken);
        xhr.setRequestHeader("X-SW-Access-Key", accessToken);

        xhr.send(data);
    });
}

function loadSelectors(obj, id) {
    if (id.titleSelector) {
        document.querySelector(id.titleSelector).innerHTML = obj.data.name;
    }

    if (id.descriptionSelector) {
        document.querySelector(id.descriptionSelector).innerHTML = obj.data.descriptionLong;
    }

    if (id.priceSelector) {
        document.querySelector(id.priceSelector).innerHTML = obj.data.price.gross + " " + configuration.currency[0].symbol;
    }

    if (id.imageSelector) {
        document.querySelector(id.imageSelector).src = obj.data.cover.media.url;
    }

    if (id.buttonSelector) {
        document.querySelector(id.buttonSelector).addEventListener("click", function () {
            createShoppingCart(id.uuid);
        });
    }
}

function getCheckoutContent() {
    return new Promise((resolve) => {
        let xhr = new XMLHttpRequest();

        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === requiredState) {
                resolve(this.responseText);
            }
        });

        xhr.open("GET", configuration.alternativeCheckoutPath);

        xhr.send();
    });
}

function addAlternativeCheckout(id) {
    return new Promise(resolve => {
        alert(document.getElementById(JSON.parse(id).buttonSelector));
        let buyButton = document.getElementById(JSON.parse(id).buttonSelector);

        getCheckoutContent().then(function (result) {
            let div = document.createElement('div');
            div.innerHTML = result;

            let button = div.getElementsByTagName('button');
            button[0].setAttribute("id", "alternative-buy-button");
            button[0].onclick = function () {
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

                popup[0].parentNode.removeChild(popup[0]);
            };

            let popup = div.getElementsByClassName('shopware-popup');
            popup[0].setAttribute("id", "popup");

            insertElementAfterTarget(div, buyButton);
        });
    });
}

function getCurrencies() {
    let data = null;

    let xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === requiredState) {
            return this.responseText;
        }
    });

    xhr.open("GET", host + "/storefront-api/sales-channel/currencies");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("X-SW-Context-Token", contextToken);
    xhr.setRequestHeader("X-SW-Access-Key", accessToken);

    xhr.send(data);
}

function loadLanguageSnippets() {
    languageSnippets = {
        thankYouForYourOrder: "Thank you for your order!",
        total: "Total",
        vat: "VAT",
        withoutFirstName: "Without first name",
        yourGoodsWillBeDeliveredTo: "Your goods will be delivered to: "
    }
}

function getLanguageSnippet(snippet) {
    if (languageSnippets[snippet]) {
        return languageSnippets[snippet];
    }
    else {
        return snippet;
    }
}
