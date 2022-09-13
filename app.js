const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todoListDB");
const itemSchema = mongoose.Schema({
  name: String,
});
const listSchema = {
  name: String,
  items: [itemSchema],
};
const Item = mongoose.model("Item", itemSchema);
const Lists = mongoose.model("list", listSchema);
const code = new Item({
  name: "Coding for 1 hour",
});
const walk = new Item({
  name: "Walk outside for 45 min",
});
const cook = new Item({
  name: "Cooking",
});

let defaultArray = [code, walk, cook];

app.get("/", function (req, res) {
  Item.find({}, function (err, docs) {
    if (docs.length === 0) {
      Item.insertMany(defaultArray, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Items inserted successfully");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: docs });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    Lists.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});
app.post("/delete", function (req, res) {
  const itemID = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(itemID, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Item has been deleted successfully");
      }
    });
    res.redirect("/");
  } else {
    Lists.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: itemID } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/:paramName", function (req, res) {
  const listName = _.capitalize(req.params.paramName);
  Lists.findOne({ name: listName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create new list
        const list = new Lists({
          name: listName,
          items: defaultArray,
        });
        list.save();
        res.redirect("/" + listName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
