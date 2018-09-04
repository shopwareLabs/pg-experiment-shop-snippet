# Shop snippet

## What is it?

The shop snippet is a playground experiment to show you, how easy you can use the Next API to develop your own experiments.

With the shop snippet you can add a full functional shop to your blog or your website with only one file.

Your customers can order your products with only one click without to leave the page to a traditional checkout.

## How can i use it?

* Before you integrate the shop snippet into your document, you have to hand over a configuration object.

    * This configuration object includes the address to the host, the access token, the grant type and a product array.
    * Into the product array you can add unlimited number of products to your own page.
    * To do this, you have to hand over an UUID of your desired product and a button selector, to make your button to your buy button.
    * Optional you can hand over a price selector, a title selector, a description selector and a image selector.
    * With the selectors you can place the product data on your page using the id's of your html elements.
    * The product data will be loaded into your HTML elements and displayed on your page.

The configuration object should look like:
   
       <script>
           let configuration = {
               host: 'http://localhost:8000',
               access_token: 'SWSCCEHUQ1HYDEV0RTZBT3PUBG',
               grant_type: 'client_credentials',
               products: [{
                   uuid: '010b94bd11be4ae29aa52d05a5dc73d9',
                   priceSelector: 'test-price',
                   titleSelector: 'test-title',
                   descriptionSelector: 'test-description',
                   imageSelector: 'test-image',
                   buttonSelector: 'test-button'
               }, {
                   uuid: '011b125c00324549a5503a2e2a889a08',
                   priceSelector: 'test-price2',
                   titleSelector: 'test-title2',
                   descriptionSelector: 'test-description2',
                   imageSelector: 'test-image2',
                   buttonSelector: 'test-button2'
               }]
           }
       </script>

* Now you can integrate the shop snippet.

This could look like:

        <script src="snippet.js"></script>
   
   
