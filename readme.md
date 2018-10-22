# Shop Snippet

## What is it?

The Shop Snippet is a Playground experiment to show you, how easy you can use the Next API to develop your own experiments.

With the Shop Snippet you can add a full functional shop to your blog or your website with only one file.

Your customers can order your products with only one click without leaving the page to a traditional checkout.

The Shop Snippet can be considered as two experiments, because it comes in two variants:
    
   1. with the Google Payment Request API
   
   2. with the PayPal Express API
        * If you download and use the variant with the PayPal Express API, you have to disable the Payment Request API setting.
          How you do that will be explained below.
    

## How can i use it?

* Important: In your sales channel you have to set the language to english by default.
    * The Next API has at the moment problems, if you don't do this.
    
* Before you integrate the Shop Snippet into your document, you have to hand over a configuration object.
    
    * The mandatory fields in your configuration object are:
    
        * the address to the Next API (Host)
            * example: pg.shopware.com
            
        * your access token
        
        * the product array
        
            * Into the product array you can add unlimited number of products to your own page.
              To do this, you have to hand over an UUID of your desired product and a button selector, to make your button to your buy button.
              The UUID's are at the end of your browser path, on the page of your desired product in the storefront.
              Example UUID: 0009beaf0bf24301a464bd5dad6aa5da
              
            * The button selector has to be a div element into which the buy button will be injected.
                * The buy button should be in a div container (in this example is it the product-buy-container), because, if the Payment Request API
                is disabled or the browser is not compatible with the Payment Request API, a traditional checkout will be injected directly after the buy button. 
                * Example:
                
                        <div class="product-buy-container">
                            <div class="button1"></div>
                        </div>
            
            * Optional you can hand over a price selector, a title selector, a description selector and an image selector.
              With the selectors you can place the product data on your page using the classes of your HTML elements.
              The product data will be loaded into your HTML elements and displayed on your page.
              
    * The optional fields in your configuration object are:
    
        * the currency
            * at the moment is only the Euro available.
            
        * the paths to your CSS files
            * if you want to change the style of your checkout or your buy button,
              you can load your own CSS files into the Shop Snippet.
              
        * the snippets for the languages
            * you can use your own or extend the old snippets.
            
        * the setting to enable or disable the Payment Request API
            * To enable the Payment Request API, you must set the allowPaymentRequestApi setting to true or remove the row,
              because the default setting is on true.
            * To disable the Payment Request API, you must set the allowPaymentRequestApi setting to false.
            * If the allowPaymentRequestApi setting is on false or the browser is not compatible with the Payment request API, 
              the Shop Snippet displays a checkout on the same page.
              
    * The optional fields can be omitted
    
* Now you can integrate the Shop snippet.
                  
The final script with the configuration object could look like this (with all configurations):
   
       <script>
           let userConfiguration = {
               api: 'http://localhost:8000',
               access_token: 'SWSCCEHUQ1HYDEV0RTZBT3PUBG',
               products: [{
                   uuid: '0009beaf0bf24301a464bd5dad6aa5da',
                   priceSelector: '.price1',
                   titleSelector: '.title1',
                   descriptionSelector: '.description1',
                   imageSelector: '.image1',
                   buttonSelector: '.button-container1'
               }, {
                   uuid: '06c7d82ba3564ed688a031439a408834',
                   priceSelector: '.price2',
                   titleSelector: '.title2',
                   descriptionSelector: '.description2',
                   imageSelector: '.image2',
                   buttonSelector: '.button-container2'
               }],
               currency: {
                   symbol: '€',
                   type: 'EUR'
               },
               css: {
                   checkout: '/css/checkout.css',
                   buyButton: '/css/buy-button.css'
               },
               allowPaymentRequestApi: false,
               languageSnippets: {
                   error: "Error",
                   thankYouForYourOrder: 'Thank you for your order!',
                   theConnectionToTheApiFailed: 'The connection to the API failed',
                   total: 'Total',
                   vat: 'VAT',
                   withoutFirstName: 'Without first name',
                   yourGoodsWillBeDeliveredTo: 'Your goods will be delivered to: '
               }
           };
       </script>
       <script src="snippet.js"></script>
