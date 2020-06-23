const PORT = process.env.PORT || 3000;
const express = require("express");
const app = express();
app.use(express.json());

const axios = require('axios')
const dbUrl = 'http://178.62.80.219/v1/graphql';

let pageNumber = 1;
let pageNumber2 = 1;
let pageNumber3 = 1;
let pageNumber4 = 1;
let pageNumber5 = 1;
let pageNumber6 = 1;

// get the result, check if the item price has change in the db, if yes update it
function setProductUrl({ productId, url }) {
  const query = `mutation {
  update_etsyProducts(where: {id: {_eq: ${productId} }}, _set: {url: "${url}" }) {
    affected_rows
  }
}`

  return axios({
    method: 'post',
    url: dbUrl,
    data: { query }
  }).catch(e => console.log('error insertProductPriceChange', e))
}
function getData() {
  console.log('getData number', pageNumber2)
  const etsyUrl = `https://openapi.etsy.com/v2/listings/active?limit=100&api_key=vnh1jmnads2rcoxpidw5wuvw&page=${pageNumber2}`;
  return axios({
    method: 'get',
    url: etsyUrl,
  }).then(res => {
    res.data.results.map((item, i) => {
      const { listing_id, price, creation_tsz, ending_tsz, original_creation_tsz, last_modified_tsz, currency_code } = item;
      const query = `
    mutation {
      insert_etsyProducts(objects: { created: ${original_creation_tsz}, price: "${price}", id: ${listing_id}, currency_code: "${currency_code}" }) {
        affected_rows
      }
    }`
      axios({
        method: 'post',
        url: dbUrl,
        data: { query }
      }).then((data) => {

      })
        .catch(e => console.log('error!!', e))

      if (res.data.results.length - 1 === i) {
        pageNumber2++
        getData()
      }
    })
  })
}
function getShopData() {
  console.log('getShopData number', pageNumber)
  const etsyUrl = `https://openapi.etsy.com/v2/shops?limit=100&api_key=vnh1jmnads2rcoxpidw5wuvw&page=${pageNumber}`;
  return axios({
    method: 'get',
    url: etsyUrl,
  }).then(res => {
    res.data.results.map((item, i) => {
      const { user_id, shop_id, shop_name } = item;
      const query = `
    mutation {
  insert_shops(objects: {id: ${shop_id}, shop_name: "${shop_name}", user_id: ${user_id} }) {
    affected_rows
  }
}`
      axios({
        method: 'post',
        url: dbUrl,
        data: { query }
      }).then((data) => {

      })
        .catch(e => console.log('error!!', e))

      if (res.data.results.length - 1 === i) {
        pageNumber++
        getShopData()
      }
    })
  })
}

function checkIfProductExist(id) {
  const query = `
  {
    etsyProducts(where: {id: {_eq: ${id} }}) {
      id
      price
      currencyCode
    }
  }`

  return axios({
    method: 'post',
    url: dbUrl,
    data: { query }
  }).then(({ data }) => {
    if (data && data.data && data.data.errors) {
      return false
    }

    if (data && data.data && data.data.etsyProducts && data.data.etsyProducts.length === 0) {
      return false
    }

    return data.data.etsyProducts[0]
  })
    .catch(e => {
      return false
    })
}
function insertProductPriceChange({ productId, currencyCode, price, previousPrice, previousCurrency }) {
  const query = `
  mutation {
    insert_priceUpdate(objects: {previousPrice: "${previousPrice}",previousCurrency: "${previousCurrency}", price: "${price}", productId: ${productId}, currencyCode: "${currencyCode}"}) {
      affected_rows
    }
  }`

  updateProductPrice({ productId, price, currencyCode })

  return axios({
    method: 'post',
    url: dbUrl,
    data: { query }
  }).catch(e => console.log('error insertProductPriceChange', e))
}
function updateProductPrice({ productId, price, currencyCode }) {
  const query = `mutation {
  update_etsyProducts(where: {id: {_eq: ${productId} }}, _set: {price: "${price}", currencyCode: "${currencyCode}" }) {
    affected_rows
  }
}`

  return axios({
    method: 'post',
    url: dbUrl,
    data: { query }
  }).catch(e => console.log('error insertProductPriceChange', e))
}


function getCategoryData() {
  console.log('getCategoryData number', pageNumber)
  const etsyUrl = `https://openapi.etsy.com/v2/listings/active?limit=100&page=${pageNumber}&taxonomy_id=901&api_key=vnh1jmnads2rcoxpidw5wuvw`;
  return axios({
    method: 'get',
    url: etsyUrl,
  }).then(res => {
    res.data.results.map(async (item, i) => {
      const { listing_id, price, original_creation_tsz, currency_code, url } = item;

      const query = `mutation {
        insert_etsyProducts(objects: { url: "${url}" currencyCode: "${currency_code}" categoryId: 1, id: ${listing_id}, price: "${price}", creationDate: ${original_creation_tsz} }) {
          affected_rows
        }
      }`

      // before insert, check if the item price has changed, if yes, add
      const product = await checkIfProductExist(listing_id)

      if (product) {
        const { price, currencyCode } = product
        if (price !== item.price) {
          console.log('price change!!', item.price, listing_id)
          await insertProductPriceChange({
            price: item.price,
            currencyCode: currency_code,
            productId: listing_id,
            previousCurrency: currencyCode,
            previousPrice: price
          })
        }
      }
      else {
        await axios({
          method: 'post',
          url: dbUrl,
          data: { query }
        }).then((data) => {
          if (data.data.errors) {
            console.log('data.data.errors', data.data.errors)
          }
        }).catch(e => console.log('error!!', e))
      }

      if (res.data.results.length - 1 === i) {
        pageNumber++
        getCategoryData()
      }
    })
  })
}
function getCategoryData2() {
  console.log('getCategoryData2 number', pageNumber2)
  const etsyUrl = `https://openapi.etsy.com/v2/listings/active?limit=100&page=${pageNumber2}&taxonomy_id=904&api_key=vnh1jmnads2rcoxpidw5wuvw`;
  return axios({
    method: 'get',
    url: etsyUrl,
  }).then(res => {
    res.data.results.map(async (item, i) => {
      const { listing_id, price, original_creation_tsz, currency_code, url } = item;

      const query = `mutation {
        insert_etsyProducts(objects: { currencyCode: "${currency_code}" categoryId: 2, id: ${listing_id}, price: "${price}", creationDate: ${original_creation_tsz} }) {
          affected_rows
        }
      }`

      // before insert, check if the item price has changed, if yes, add
      const product = await checkIfProductExist(listing_id)

      if (product) {
        const { price, currencyCode } = product
        if (price !== item.price) {
          console.log('price change!!', item.price, listing_id)
          await insertProductPriceChange({
            price: item.price,
            currencyCode: currency_code,
            productId: listing_id,
            previousCurrency: currencyCode,
            previousPrice: price
          })
        }
      }
      else {
        await axios({
          method: 'post',
          url: dbUrl,
          data: { query }
        }).then((data) => {
          if (data.data.errors) {
            console.log('data.data.errors', data.data.errors)
          }
        }).catch(e => console.log('error!!', e))
      }

      if (res.data.results.length - 1 === i) {
        pageNumber2++
        getCategoryData2()
      }
    })
  })
}
function getCategoryData3() {
  console.log('getCategoryData3 number', pageNumber3)
  const etsyUrl = `https://openapi.etsy.com/v2/listings/active?limit=100&page=${pageNumber3}&taxonomy_id=902&api_key=vnh1jmnads2rcoxpidw5wuvw`;
  return axios({
    method: 'get',
    url: etsyUrl,
  }).then(res => {
    res.data.results.map(async (item, i) => {
      const { listing_id, price, original_creation_tsz, currency_code, url } = item;

      const query = `mutation {
        insert_etsyProducts(objects: { currencyCode: "${currency_code}" categoryId: 3, id: ${listing_id}, price: "${price}", creationDate: ${original_creation_tsz} }) {
          affected_rows
        }
      }`

      // before insert, check if the item price has changed, if yes, add
      const product = await checkIfProductExist(listing_id)

      if (product) {
        const { price, currencyCode } = product
        if (price !== item.price) {
          console.log('price change!!', item.price, listing_id)
          await insertProductPriceChange({
            price: item.price,
            currencyCode: currency_code,
            productId: listing_id,
            previousCurrency: currencyCode,
            previousPrice: price
          })
        }
      }
      else {
        await axios({
          method: 'post',
          url: dbUrl,
          data: { query }
        }).then((data) => {
          if (data.data.errors) {
            console.log('data.data.errors', data.data.errors)
          }
        }).catch(e => console.log('error!!', e))
      }

      if (res.data.results.length - 1 === i) {
        pageNumber3++
        getCategoryData3()
      }
    })
  })
}
function getCategoryData4() {
  console.log('getCategoryData4 number', pageNumber4)
  const etsyUrl = `https://openapi.etsy.com/v2/listings/active?limit=100&page=${pageNumber4}&taxonomy_id=903&api_key=vnh1jmnads2rcoxpidw5wuvw`;
  return axios({
    method: 'get',
    url: etsyUrl,
  }).then(res => {
    res.data.results.map(async (item, i) => {
      const { listing_id, price, original_creation_tsz, currency_code, url } = item;

      const query = `mutation {
        insert_etsyProducts(objects: { currencyCode: "${currency_code}" categoryId: 4, id: ${listing_id}, price: "${price}", creationDate: ${original_creation_tsz} }) {
          affected_rows
        }
      }`

      // before insert, check if the item price has changed, if yes, add
      const product = await checkIfProductExist(listing_id)

      if (product) {
        const { price, currencyCode } = product
        if (price !== item.price) {
          console.log('price change!!', item.price, listing_id)
          await insertProductPriceChange({
            price: item.price,
            currencyCode: currency_code,
            productId: listing_id,
            previousCurrency: currencyCode,
            previousPrice: price
          })
        }
      }
      else {
        await axios({
          method: 'post',
          url: dbUrl,
          data: { query }
        }).then((data) => {
          if (data.data.errors) {
            console.log('data.data.errors', data.data.errors)
          }
        }).catch(e => console.log('error!!', e))
      }

      if (res.data.results.length - 1 === i) {
        pageNumber4++
        getCategoryData4()
      }
    })
  })
}
function getCategoryData5() {
  console.log('getCategoryData5 number', pageNumber5)
  const etsyUrl = `https://openapi.etsy.com/v2/listings/active?limit=100&page=${pageNumber5}&taxonomy_id=905&api_key=vnh1jmnads2rcoxpidw5wuvw`;
  return axios({
    method: 'get',
    url: etsyUrl,
  }).then(res => {
    res.data.results.map(async (item, i) => {
      const { listing_id, price, original_creation_tsz, currency_code, url } = item;

      const query = `mutation {
        insert_etsyProducts(objects: { currencyCode: "${currency_code}" categoryId: 5, id: ${listing_id}, price: "${price}", creationDate: ${original_creation_tsz} }) {
          affected_rows
        }
      }`

      // before insert, check if the item price has changed, if yes, add
      const product = await checkIfProductExist(listing_id)

      if (product) {
        const { price, currencyCode } = product
        if (price !== item.price) {
          console.log('price change!!', item.price, listing_id)
          await insertProductPriceChange({
            price: item.price,
            currencyCode: currency_code,
            productId: listing_id,
            previousCurrency: currencyCode,
            previousPrice: price
          })
        }
      }
      else {
        await axios({
          method: 'post',
          url: dbUrl,
          data: { query }
        }).then((data) => {
          if (data.data.errors) {
            console.log('data.data.errors', data.data.errors)
          }
        }).catch(e => console.log('error!!', e))
      }

      if (res.data.results.length - 1 === i) {
        pageNumber5++
        getCategoryData5()
      }
    })
  })
}
function getCategoryData6() {
  console.log('getCategoryData6 number', pageNumber6)
  const etsyUrl = `https://openapi.etsy.com/v2/listings/active?limit=100&page=${pageNumber6}&taxonomy_id=906&api_key=vnh1jmnads2rcoxpidw5wuvw`;
  return axios({
    method: 'get',
    url: etsyUrl,
  }).then(res => {
    res.data.results.map(async (item, i) => {
      const { listing_id, price, original_creation_tsz, currency_code, url } = item;

      const query = `mutation {
        insert_etsyProducts(objects: { currencyCode: "${currency_code}" categoryId: 6, id: ${listing_id}, price: "${price}", creationDate: ${original_creation_tsz} }) {
          affected_rows
        }
      }`

      // before insert, check if the item price has changed, if yes, add
      const product = await checkIfProductExist(listing_id)

      if (product) {
        const { price, currencyCode } = product
        if (price !== item.price) {
          console.log('price change!!', item.price, listing_id)
          await insertProductPriceChange({
            price: item.price,
            currencyCode: currency_code,
            productId: listing_id,
            previousCurrency: currencyCode,
            previousPrice: price
          })
        }
      }
      else {
        await axios({
          method: 'post',
          url: dbUrl,
          data: { query }
        }).then((data) => {
          if (data.data.errors) {
            console.log('data.data.errors', data.data.errors)
          }
        }).catch(e => console.log('error!!', e))
      }

      if (res.data.results.length - 1 === i) {
        pageNumber6++
        getCategoryData6()
      }
    })
  })
}

app.get("/", function(req, res) {
  const promise1 = getCategoryData()
  const promise2 = getCategoryData2()
  const promise3 = getCategoryData3()
  const promise4 = getCategoryData3()
  const promise5 = getCategoryData3()
  const promise6 = getCategoryData3()

  Promise.all([promise1, promise2, promise3, promise4, promise5, promise6]).then((values) => {
    res.send("Hello World");
  });
});

app.listen(PORT, function() {
  console.log(`Listening on Port ${PORT}`);
});
