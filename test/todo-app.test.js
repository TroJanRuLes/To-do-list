const test = require('tape');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'));
require('jsdom-global')(html);

const app = require('../lib/todo-app.js');
const elmish = require('../lib/elmish.js');

const id = 'test-app';

test('todo `model` (Object) has desired keys', function(t) {
    const keys = Object.keys(app.model);
    t.deepEqual(keys, ['todos', 'hash'], "`todos` and `hash` keys are present.");
    t.true(Array.isArray(app.model.todos), "model.todos is an Array");
    t.end();
});

test('todo `update` default case should return model unmodified', function(t) {
    const model = JSON.parse(JSON.stringify(app.model));
    const unmodified_model = app.update('UNKNOWN_ACTION', model);
    t.deepEqual(model, unmodified_model, "model returned unmodified");
    t.end();
});

test('`ADD` a new todo item to model.todos Array via `update`', function(t) {
    const model = JSON.parse(JSON.stringify(app.model));
    t.equal(model.todos.length, 0, "initial model.todos.length is 0");

    const updated_model = app.update('ADD', model, "Add Todo List Item");
    const expected = { id: 1, title: "Add Todo List Item", done: false };

    t.equal(updated_model.todos.length, 1, "updated_model.todos.length is 1");
    t.deepEqual(updated_model.todos[0], expected, "Todo list item added.");
    t.end();
});

test('`TOGGLE` a todo item from done=false to done=true', function(t) {
    const model = JSON.parse(JSON.stringify(app.model));
    const model_with_todo = app.update('ADD', model, "Toggle a todo list item");
    const item = model_with_todo.todos[0];
    const model_todo_done = app.update('TOGGLE', model_with_todo, item.id);
    const expected = { id: 1, title: "Toggle a todo list item", done: true };

    t.deepEqual(model_todo_done.todos[0], expected, "Todo list item Toggled.");
    t.end();
});

test('render_item HTML for a single Todo Item', function(t) {
    const model = {
        todos: [{ id: 1, title: "Learn Elm Architecture", done: true }],
        hash: '#/'
    };

    document.getElementById(id).appendChild(app.render_item(model.todos[0]));

    const done = document.querySelectorAll('.completed')[0].textContent;
    t.equal(done, 'Learn Elm Architecture', 'Done: Learn "TEA"');

    const checked = document.querySelectorAll('input')[0].checked;
    t.equal(checked, true, 'Done: ' + model.todos[0].title + " is done=true");

    elmish.empty(document.getElementById(id));
    t.end();
});

test('render "main" view using (elmish) HTML DOM functions', function(t) {
    const model = {
        todos: [
            { id: 1, title: "Learn Elm Architecture", done: true },
            { id: 2, title: "Build Todo List App", done: false },
            { id: 3, title: "Win the Internet!", done: false }
        ],
        hash: '#/'
    };

    document.getElementById(id).appendChild(app.render_main(model));

    document.querySelectorAll('.view').forEach(function(item, index) {
        t.equal(item.textContent, model.todos[index].title,
            "index #" + index + " <label> text: " + item.textContent);
    });

    const inputs = document.querySelectorAll('input');
    [true, false, false].forEach(function(state, index) {

        t.equal(inputs[index + 1].checked, state,
            "Todo #" + index + " is done=" + state);
    });

    elmish.empty(document.getElementById(id));
    t.end();
});

test('render_footer view using (elmish) HTML DOM functions', function(t) {
    const model = {
        todos: [
            { id: 1, title: "Learn Elm Architecture", done: true },
            { id: 2, title: "Build Todo List App", done: false },
            { id: 3, title: "Win the Internet!", done: false }
        ],
        hash: '#/'
    };

    document.getElementById(id).appendChild(app.render_footer(model));

    const left = document.getElementById('count').innerHTML;
    t.equal(left, "<strong>2</strong> items left", "Todos remaining: " + left);

    t.equal(document.querySelectorAll('li').length, 3, "3 <li> in <footer>");

    const link_text = ['All', 'Active', 'Completed'];
    const hrefs = ['#/', '#/active', '#/completed'];
    document.querySelectorAll('a').forEach(function(a, index) {
        t.equal(a.textContent, link_text[index], "<footer> link #" + index +
            " is: " + a.textContent + " === " + link_text[index]);

             const href = a.getAttribute('href');
        t.equal(href, hrefs[index],
            "<footer> link #" + index + " href is: " + hrefs[index]);
    });

    const clear = document.querySelectorAll('.clear-completed')[0].textContent;
    t.equal(clear, 'Clear completed', '<button> in <footer> "Clear completed"');

    elmish.empty(document.getElementById(id));
    t.end();
});

test('view renders the whole todo app using "partials"', function(t) {
    document.getElementById(id).appendChild(app.view(app.model));

    t.equal(document.querySelectorAll('h1')[0].textContent, "todos", "<h1>todos");

    const placeholder = document.getElementById('new-todo')
        .getAttribute("placeholder");
    t.equal(placeholder, "What needs to be done?", "placeholder set on <input>");

    const left = document.getElementById('count').innerHTML;
    t.equal(left, "<strong>0</strong> items left", "Todos remaining: " + left);

    elmish.empty(document.getElementById(id));
    t.end();
});

test('1. No Todos, should hide #footer and #main', function(t) {
    document.getElementById(id).appendChild(app.view({ todos: [] }));

    const mainEl = document.querySelector('.main');
    const footerEl = document.querySelector('.footer');

    t.equal(mainEl.style.display, 'none', "No Todos, hide #main");
    t.equal(footerEl.style.display, 'none', "No Todos, hide #footer");

    elmish.empty(document.getElementById(id));
    t.end();
});

test('3. Mark all as completed ("TOGGLE_ALL")', function(t) {
    elmish.empty(document.getElementById(id));
    localStorage.removeItem('elmish_store');

    const model = {
        todos: [
            { id: 1, title: "Learn Elm Architecture", done: true },
            { id: 2, title: "Build Todo List App", done: false },
            { id: 3, title: "Win the Internet!", done: false }
        ],
        hash: '#/'
    };

     let lastAction = null;
    let lastData = null;
    window.signal = function(action, data) {
        lastAction = action;
        lastData = data;
        const newModel = app.update(action, model, data);
        if (newModel !== model) {
            Object.assign(model, newModel);
        }
    };
  //render
     const root = document.getElementById(id);
    elmish.empty(root);
    root.appendChild(app.view(model));

     const toggleAll = document.querySelector('.toggle-all');
    toggleAll.click();

     t.equal(lastAction, 'TOGGLE_ALL', "signal called with TOGGLE_ALL");

      const allDone = model.todos.every(t => t.done);
    t.true(allDone, "all items are completed");

    elmish.empty(document.getElementById(id));
    localStorage.removeItem('elmish_store');
    t.end();
});

console.log('✅ Все тесты запущены!');
