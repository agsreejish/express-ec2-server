
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
//const userRouter = require('./routes/user');
const path = require('path');

const app = express();

//handles GET / request
/*app.get('/', (req, rep) => {
  try {
    rep.sendFile('index.html');
  }
  catch (e) { console.log(e) }
});*/

app.use('/api',userRouter);

//launching server at port : 4000 in local environment
const listener = app.listen(process.env.PORT || 4000, (err) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  console.log(`server running at ${listener.address().port}`)
})
