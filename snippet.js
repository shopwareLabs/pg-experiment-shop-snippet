(function () {
    let host;
    let products;
    let accessToken;
    let contextToken;
    let languageSnippets;
    let paymentRequestApi = true;
    let xhr;
    const requiredState = 4;

    let init = function () {
        xhr = new XMLHttpRequest();

        loadLanguageSnippets();

        if (configuration.host) {
            host = configuration.host;
        }

        if (configuration.access_token) {
            accessToken = configuration.access_token;
        }

        if (configuration.products) {
            products = configuration.products.slice();

            products.forEach(function (product) {
                productDataQuery(product);
            });
        }

        if (configuration.allowPaymentRequestApi != null && !configuration.allowPaymentRequestApi) {
            paymentRequestApi = false;
        }
    };

    let getAjaxResponse = function (method, route, data) {
        return new Promise(resolve => {
            xhr.addEventListener('readystatechange', function () {
                if (this.readyState === requiredState) {
                    resolve(this.responseText);
                }
            });

            if (method && route) {
                xhr.open(method, host + route);
            }

            if (accessToken) {
                xhr.setRequestHeader('X-SW-Access-Key', accessToken);
            }

            if (contextToken) {
                xhr.setRequestHeader('X-SW-Context-Token', contextToken);
            }

            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Accept', 'application/json');


            xhr.send(data);
        });
    };

    let productDataQuery = function (product) {
        let data = null;
        let method = 'GET';
        let route = `/storefront-api/product/${product.uuid}`;

        getAjaxResponse(method, route, data).then(function (result) {
            if (isJson(result)) {
                let obj = JSON.parse(result);
                loadSelectors(obj, product);
            }
        });
    };

    let createShoppingCart = function (id) {
        let data = null;
        let method = 'POST';
        let route = '/storefront-api/checkout/cart';

        getAjaxResponse(method, route, data).then(function (result) {
            if (isJson(result)) {
                contextToken = JSON.parse(result)['x-sw-context-token'];
                addItemToCart(id);
            }
        });
    };

    let addItemToCart = function (id) {
        let data = JSON.stringify({
            'type': 'product',
            'quantity': 1,
            'payload': {
                'id': id
            }
        });
        let method = 'POST';
        let route = `/storefront-api/checkout/cart/line-item/${id}`;

        getAjaxResponse(method, route, data).then(function (result) {
            if (isJson(result)) {
                let data = JSON.parse(result).data;
                showPaymentRequest(data);
            }
        });
    };

    let showPaymentRequest = function (productData) {
        if (!paymentRequestApi || !window.PaymentRequest) {
            if (document.querySelector('div.shopware-popup')) {
                let popup = document.querySelector('div.shopware-popup');
                popup.parentNode.removeChild(popup);
            }

            let id;
            let productId = JSON.stringify(productData.lineItems[0].key);

            for (let i = 0; i < products.length; i++) {
                if (JSON.stringify(products[i].uuid) === productId) {
                    id = JSON.stringify(products[i]);
                }
            }

            addAlternativeCheckout(id);
            return;
        }

        usePaymentRequestApi(productData);
    };

    let usePaymentRequestApi = function (data) {
        let productName = data.lineItems[0].label;
        let price = data.price;
        let shipping = data.deliveries;

        const supportedPaymentMethods = [
            {
                supportedMethods: 'basic-card',
                data: {
                    supportedNetworks: ['visa', 'mastercard', 'amex'],
                    supportedTypes: ['debit', 'credit']
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
                    label: getLanguageSnippet('vat'),
                    amount: {
                        currency: configuration.currency[0].type,
                        value: price.calculatedTaxes[0].tax
                    }
                }
            ],
            shippingOptions: getShippingOptions(shipping),
            total: {
                label: getLanguageSnippet('total'),
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
    };

    let insertElementAfterTarget = function (newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    };

    let guestOrder = function (customer) {
        getCountryId(customer.shippingAddress.country).then(function (result) {
            let name = splitName(customer.details.billingAddress.recipient);
            let method = 'POST';
            let route = '/storefront-api/checkout/guest-order';
            let data = {
                firstName: getLanguageSnippet('withoutFirstName'),
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

            getAjaxResponse(method, route, data).then(function (result) {
                if (isJson(result)) {
                    let obj = JSON.parse(result);
                    alert(`${getLanguageSnippet('thankYouForYourOrder')} \n ${getLanguageSnippet('yourGoodsWillBeDeliveredTo')} ${obj.data.billingAddress.street}`);
                    init();
                }
            });
        });
    };

    let splitName = function (fullName) {
        return fullName.split(' ');
    };

    let getShippingOptions = function (shipping) {
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
    };

    let getCountryId = function (iso) {
        return new Promise((resolve) => {
            let data = null;
            let countryId = null;
            let method = 'GET';
            let route = '/storefront-api/sales-channel/countries';

            getAjaxResponse(method, route, data).then(function (result) {
                if (isJson(result)) {
                    let countries = JSON.parse(result).data;

                    for (let i = 0; i < countries.length; i++) {
                        if (iso === countries[i].iso) {
                            countryId = countries[i].id;
                            resolve(countryId);
                        }
                    }
                }
            });
        });
    };

    let loadSelectors = function (obj, product) {
        if (product.titleSelector) {
            document.querySelector(product.titleSelector).innerHTML = obj.data.name;
        }

        if (product.descriptionSelector) {
            document.querySelector(product.descriptionSelector).innerHTML = obj.data.descriptionLong;
        }

        if (product.priceSelector) {
            document.querySelector(product.priceSelector).innerHTML = obj.data.price.gross + ' ' + configuration.currency[0].symbol;
        }

        if (product.imageSelector) {
            document.querySelector(product.imageSelector).src = obj.data.cover.media.url;
        }

        if (product.buttonSelector) {
            document.querySelector(product.buttonSelector).addEventListener('click', function () {
                createShoppingCart(product.uuid);
            });
        }
    };

    let getCheckoutContent = function () {
        return new Promise((resolve) => {
            let xhr = new XMLHttpRequest();

            xhr.addEventListener('readystatechange', function () {
                if (this.readyState === requiredState) {
                    resolve(this.responseText);
                }
            });

            xhr.open('GET', configuration.alternativeCheckoutPath);

            xhr.send();
        });
    };

    let addAlternativeCheckout = function (id) {
        return new Promise(resolve => {
            let buyButton = document.querySelector(JSON.parse(id).buttonSelector);

            getCheckoutContent().then(function (result) {
                let div = document.createElement('div');
                div.innerHTML = result;

                let button = div.getElementsByTagName('button');
                button[0].setAttribute('class', 'btn-submit');
                button[0].onclick = function () {
                    let data = {
                        payerEmail: document.querySelector('.alternative-email').value,
                        details: {
                            billingAddress: {
                                addressLine: [document.querySelector('.alternative-address').value],
                                city: document.querySelector('.alternative-city').value,
                                postalCode: document.querySelector('.alternative-postcode').value,
                                recipient: `${document.querySelector('.alternative-first-name').value} ${document.querySelector('.alternative-last-name').value}`
                            }
                        },
                        shippingAddress: {
                            country: document.querySelector('.alternative-country').value
                        }
                    };
                    if(isJson(data)){
                        guestOrder(data);

                        let popup = document.querySelector('div.shopware-popup');
                        popup.parentNode.removeChild(popup);
                    }
                };

                insertElementAfterTarget(div, buyButton);
            });
        });
    };

    let loadLanguageSnippets = function () {
        languageSnippets = {
            thankYouForYourOrder: 'Thank you for your order!',
            total: 'Total',
            vat: 'VAT',
            withoutFirstName: 'Without first name',
            yourGoodsWillBeDeliveredTo: 'Your goods will be delivered to: '
        }
    };

    let getLanguageSnippet = function (snippet) {
        if (languageSnippets[snippet]) {
            return languageSnippets[snippet];
        }
        else {
            return snippet;
        }
    };

    let isJson = function (json) {
        try {
            JSON.parse(json);
        } catch (e) {
            try {
                JSON.stringify(json);
            } catch (e) {
                return false;
            }
        }
        return true;
    };

    init();
})();
