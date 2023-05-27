const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const date_format = require("date-fns/format");
var isValid = require("date-fns/isValid");
const app = express();
app.use(express.json());

const main_path = path.join(__dirname, "todoApplication.db");
let todo_DB = null;
const intilize_todo_DB = async () => {
  try {
    todo_DB = await open({
      filename: main_path,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at 3000");
    });
  } catch (e) {
    console.log(`${e.message}`);
    process.exit(1);
  }
};
intilize_todo_DB();

const has_status = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const has_priority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const has_priority_and_has_status = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const has_category_and_has_status = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const has_category = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const has_category_and_has_priority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
const change_label = (id) => {
  return {
    id: id.id,
    todo: id.todo,
    priority: id.priority,
    status: id.status,
    category: id.category,
    dueDate: id.due_date,
  };
};

app.get("/todos/", async (request, reponse) => {
  const { status, search_q = "", priority, category } = request.query;
  let todo_query;
  switch (true) {
    case has_status(request.query):
      todo_query = `
      SELECT 
      *
      FROM
      todo
      WHERE
      status = "${status}" AND todo LIKE "%${search_q}%"
      ;`;
      break;
    case has_priority(request.query):
      todo_query = `
      SELECT
      *
      FROM
      todo
      WHERE
      priority="${priority}" AND todo LIKE "%${search_q}%"
      ;`;
      break;
    case has_priority_and_has_status(request.query):
      todo_query = `
      SELECT
      *
      FROM
      todo
      WHERE
      priority="${priority}" And status ="${status}" AND todo LIKE "%${search_q}%"
      ;`;
      break;
    case has_category_and_has_status(request.query):
      todo_query = `
      SELECT 
      *
      FROM 
      todo
      WHERE
      category="${category}" AND status="${status}" AND todo LIKE "%${search_q}%"
      ;`;
      break;
    case has_category(request.query):
      todo_query = `
      SELECT
      *
      FROM 
      todo
      WHERE
      category="${category}" AND todo LIKE "%${search_q}%"
      ;`;
      break;
    case has_category_and_has_priority(request.query):
      todo_query = `
      SELECT
      *
      FROM
      todo
      WHERE 
      category="${category}" AND priority="${priority}" AND todo LIKE "%${search_q}%"
      ;`;
      break;
    default:
      todo_query = `
      SELECT
      *
      FROM 
      todo
      WHERE
      todo LIKE "%${search_q}%"
      ;`;
      break;
  }
  const get_details = await todo_DB.all(todo_query);
  reponse.send(
    get_details.map((id) => {
      return change_label(id);
    })
  );
});

///2---get by todo id
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const get_by_id_query = `
  SELECT
  *
  FROM 
  todo 
  WHERE 
  id=${todoId}
  ;`;
  const get_todoby_id = await todo_DB.get(get_by_id_query);
  response.send(change_label(get_todoby_id));
});
module.exports = app;

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const my_formatted_date = date_format(new Date(date), "yyyy-MM-dd");
  const validate_date = isValid(date);
  console.log(validate_date);
  const get_due_date_query = `
  SELECT
  *
  FROM
  todo
  WHERE
  due_date=${my_formatted_date}  
  ;`;
  const get_due_data = await todo_DB.all(get_due_date_query);
  console.log(get_due_data);
  response.send(get_due_data);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const date_obj = new Date(dueDate);
  const insert_query = `
  INSERT INTO 
  todo (id,todo,priority,status,category,status,due_date)
  VALUES
  (${id},"${todo}","${priority}","${status}","${category}",${date_obj}) 

  ;`;
  const insert_todo = await todo_DB.run(insert_query);
  response.send("Todo Successfully Added");
});
