# Shop snippet

## What is it?

The shop snippet is a playground experiment to show you, how easy you can use the Next API to develop your own experiments.

With the shop snippet you can add a full functional shop to your blog or your website with only one file.

Your customers can order your products with only one click without leaving the page to a traditional checkout.

## How can i use it?

* Before you integrate the shop snippet into your document, you have to hand over a configuration object.

    * This configuration object includes the address to the host, the access token, the product array, the currency, 
      the path to the alternative checkout and the setting to enable or disable the payment request API.
    * Into the product array you can add unlimited number of products to your own page.
    * To do this, you have to hand over an UUID of your desired product and a button selector, to make your button to your buy button.
    * Optional you can hand over a price selector, a title selector, a description selector and a image selector.
    * With the selectors you can place the product data on your page using the id's of your html elements.
    * The product data will be loaded into your HTML elements and displayed on your page.
    * To enable the payment request API, you must set the allowPaymentRequestApi setting to true or remove the row,
      because the default setting is on true.
    * If the allowPaymentRequestApi setting is on false or the browser is not compatible with the API, 
      the shop snippet displays an alternative checkout on the same page.

The configuration object should look like:
   
       <script>
           let configuration = {
               host: 'http://localhost:8000',
               access_token: 'SWSCCEHUQ1HYDEV0RTZBT3PUBG',
               products: [{
                   uuid: '010b94bd11be4ae29aa52d05a5dc73d9',
                   priceSelector: '.test-price.one',
                   titleSelector: '.test-title.one',
                   descriptionSelector: '.test-description.one',
                   imageSelector: '.test-image.one',
                   buttonSelector: '.test-button.one'
               }, {
                   uuid: '011b125c00324549a5503a2e2a889a08',
                   priceSelector: '.test-price.two',
                   titleSelector: '.test-title.two',
                   descriptionSelector: '.test-description.two',
                   imageSelector: '.test-image.two',
                   buttonSelector: '.test-button.two'
               }],
               currency: [{
                   symbol: '€',
                   type: 'EUR'
               }],
               alternativeCheckoutPath: "/alternative-checkout.html",
               allowPaymentRequestApi: false
           };
       </script>

* Now you can integrate the shop snippet.

This could look like:

        <script src="snippet.js"></script>
   
   
