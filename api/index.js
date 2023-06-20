const express = require("express");
const fs = require("fs");
const app = express();
const { v4 } = require("uuid"); // fix for vercel.com

const jsonParser = express.json();

app.use(express.static(__dirname + "/public"));

const filePathStatic = __dirname + "/users.json";
fs.copyFileSync(filePathStatic, "/tmp/users.json");
const filePath = "/tmp/users.json"; // fix for vercel.com (read only files, only tmp folder writable)

app.get("/api/users", function (req, res) {
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate");
  const content = fs.readFileSync(filePath, "utf8");
  const users = JSON.parse(content);
  console.log(`Requested GET method api/users; Users data: ${content}`);

  res.send(users);
});

app.get("/api/users/:id", function (req, res) {
  const id = req.params.id;
  const content = fs.readFileSync(filePath, "utf8");
  const users = JSON.parse(content);
  console.log(`Requested GET method api/users/:user; Users data: ${content}`);

  let user = users.find((item) => item.id == id);
  console.log(`Requested user found; User data: ${JSON.stringify(user)}`);

  if (user) {
    res.send(user);
  } else {
    res.status(404).send();
  }
});

// получение отправленных данных
app.post("/api/users", jsonParser, function (req, res) {
  if (!req.body) {
    return res.sendStatus(400);
  }
  console.log(
    `Requested POST method api/users; User data: ${JSON.stringify(
      req.body,
      null,
      2
    )}`
  );

  let user = { name: req.body.name, age: req.body.age };
  const content = fs.readFileSync(filePath, "utf8");
  const users = JSON.parse(content);

  let lastId = Math.max(...users.map((item) => item.id));
  user.id = lastId + 1;
  users.push(user);

  let newData = JSON.stringify(users, null, 2);
  console.log(`New Users data: ${newData}`);
  fs.writeFileSync(filePath, newData, "utf8");

  res.send(user);
});

// удаление пользователя по id
app.delete("/api/users/:id", function (req, res) {
  let deleteId = req.params.id;
  console.log(
    `Requested DELETE method api/users/:id; User data to delete: ${deleteId}`
  );

  const content = fs.readFileSync(filePath, "utf8");
  const users = JSON.parse(content);

  let newData = JSON.stringify(
    users.filter((item) => item.id != deleteId),
    null,
    2
  );
  let deletedUser = users.filter((item) => item.id == deleteId)[0];
  console.log(`New Users data: ${newData}`);
  fs.writeFileSync(filePath, newData, "utf8");

  res.send(deletedUser);
});

// изменение пользователя
app.put("/api/users", jsonParser, function (req, res) {
  if (!req.body) {
    return res.sendStatus(400);
  }
  console.log(
    `Requested PUT method api/users; User data: ${JSON.stringify(
      req.body,
      null,
      2
    )}`
  );

  let user = { id: req.body.id, name: req.body.name, age: req.body.age };
  const content = fs.readFileSync(filePath, "utf8");
  const users = JSON.parse(content);

  let editUserIndex = users.findIndex((item) => item.id == user.id);
  console.log(`Index of edited user: ${editUserIndex}`);

  if (!isFinite(editUserIndex)) {
    res.status(404).send();
  } else {
    users[editUserIndex].name = user.name;
    users[editUserIndex].age = user.age;
    let newData = JSON.stringify(users, null, 2);
    console.log(`New Users data to change: ${newData}`);
    fs.writeFileSync(filePath, newData, "utf8");
    res.send(user);
  }
});

// fix for vercel.com :

/*
const server = app.listen(3000, () => {
  console.log("Server is waiting for connection...");
});
*/

module.exports = app;
