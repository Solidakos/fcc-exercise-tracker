const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require("mongoose")
let bodyParser = require('body-parser');
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(bodyParser.urlencoded({ extended: true }));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
})

const exerciseSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: Date
})

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);


app.post("/api/users", async (req, res) => {
  const newUser = new User({ username: req.body.username });
  const save = await newUser.save().catch(err => console.log(err));
  res.json({ username: newUser.username, _id: newUser._id })
})

app.get("/api/users", async (req, res) => {
  const find = await User.find({})
    .then(data => { res.json(data) })
    .catch(err => console.log(err))
})

app.post("/api/users/:_id/exercises", async (req, res) => {
  const user_id = req.params._id;

  const user = await User.findById(user_id)
  if (user == null) {
    res.send("Error finding the user")
  } else {
    const newExercise = new Exercise({
      user_id: user_id,
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date ? new Date(req.body.date) : new Date()
    })

    const save = await newExercise.save().catch(err => console.log(err));
    res.json({
      _id: user._id,
      username: user.username,
      description: save.description,
      duration: save.duration,
      date: new Date(save.date).toDateString()
    })
  }

})

app.get("/api/users/:_id/logs", async (req, res) => {
  let { from, to, limit } = req.query;
  const user_id = req.params._id;
  const user = await User.findById(user_id)
  if (user == null) {
    res.send("Error finding the user")
  } else {
    let filter = { user_id };
    let dateFilter = {};
    if (!limit) { limit = 500 };
    if (from) { dateFilter["$gte"] = new Date(from) };
    if (to) { dateFilter["$lte"] = new Date(to) };
    if (from || to) { filter.date = dateFilter };

    const userExercises = await Exercise.find(filter).limit(limit);

    const log = userExercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: new Date(e.date).toDateString()
    }))

    res.json({
      _id: user_id,
      username: user.username,
      count: userExercises.length,
      log
    })
  }

})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
