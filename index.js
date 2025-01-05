const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");
const { MongoClient } = require("mongodb");
const dev_secret = "13a8468c3f64e1054c21a6a03804b9";
const sandbox_secret = "b574f5c5c854333952feae0b3b2914";
const client_id = "66084b76da645a001b11632b";

const configuration = new Configuration({
  basePath: PlaidEnvironments.development,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": client_id,
      "PLAID-SECRET": dev_secret,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

const mongoClient = new MongoClient(
  "mongodb+srv://ibrahimmuhammad4:Ic8JAPSH41ZGsQqa@cluster0.lwhaasj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
);

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/hello", (request, response) => {
  response.json({ message: "hello " + request.body.name });
});

app.post("/create_link_token", async function (request, response) {
  const plaidRequest = {
    user: {
      client_user_id: 'user-id',
    },
    client_name: "Plaid Test App",
    products: ["auth"],
    language: "en",
    country_codes: ["US"],
  };
  try {
    const createTokenResponse = await plaidClient.linkTokenCreate(plaidRequest);
    response.json(createTokenResponse.data);
  } catch (error) {
    response.json(error.message);
  }
});

app.post("/exchange_public_token", async function (request, response) {
  const publicToken = request.body.public_token;
  try {
    const plaidResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    const accessToken = plaidResponse.data.access_token;
    response.json({ accessToken });
  } catch (error) {
    response.json(error.message);
  }
});

app.post("/auth", async function (request, response) {
  try {
    const access_token = request.body.access_token;
    const plaidRequest = { access_token: access_token };
    const plaidResponse = await plaidClient.authGet(plaidRequest);
    response.json(plaidResponse.data);
  } catch (error) {
    response.json(error.message);
  }
});

app.post("/get_users", async function (request, response) {
  try {
    const mongoResponse = await mongoClient
      .db("sample_mflix")
      .collection("finale_accounts")
      .find()
      .toArray();
    response.json(mongoResponse);
  } catch (error) {
    response.json(error.message);
  }
});

app.post("/create_user", async function (request, response) {
  try {
    const account = {
      name: "Baby Zara",
      access_token: request.body.access_token,
      account_number: request.body.account_number,
      routing_number: request.body.routing_number,
    };
    await mongoClient
      .db("sample_mflix")
      .collection("finale_accounts")
      .insertOne(account);
    response.status(200);
  } catch (error) {
    response.json(error.message);
  }
});

app.listen(8000, () => {
  console.log("server has started");
});
