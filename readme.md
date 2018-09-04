# Shop snippet

## What is it?

The shop snippet is a playground experiment to show you, how easy you can use the Next API to develop your own experiments.

With the shop snippet you can add a full functional shop to your blog or your website with only one file.

Your customers can order your products with only one click without to leave the page to a traditional checkout.

## How can i use it?

1. Before you integrate the shop snippet into your document, you have to hand over a configuration object.

    1. This configuration object includes the address to the host, the access token, the grant type and a product array.
    2. Into the product array you can add unlimited your products to your own page.
    
2. 
   
   
   The configuration object should looks like:
   
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
