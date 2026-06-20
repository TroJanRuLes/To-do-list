if (typeof require !== 'undefined' && typeof module !== 'undefined' && module.exports) {
    var { h, div, span, p, h1, ul, li, button, input, label, a, footer,
        section, header, strong, text, empty, mount } = require('./elmish.js');
}

const initial_model = {
    todos: [],
    hash: '#/'
};

function update(action, model, data) {
    const newModel = JSON.parse(JSON.stringify(model));

    switch (action) {
        case 'ADD':
            const newTask = {
                id: newModel.todos.length + 1,
                title: data.title || data,
                done: false,
                dueDate: data.dueDate || null
            };
            newModel.todos.push(newTask);
            break;

        case 'TOGGLE':
            const toggleItem = newModel.todos.find(t => t.id === data);
            if (toggleItem) {
                toggleItem.done = !toggleItem.done;
            }
            break;

        case 'TOGGLE_ALL':
            const allDone = newModel.todos.every(t => t.done);
            newModel.todos.forEach(t => t.done = !allDone);
            break;

        case 'DELETE':
            newModel.todos = newModel.todos.filter(t => t.id !== data);
            break;

        case 'CLEAR_COMPLETED':
            newModel.todos = newModel.todos.filter(t => t.done === false);
            break;

        case 'SET_HASH':
            newModel.hash = data;
            break;

        case 'EDIT_TASK':
            const editItem = newModel.todos.find(t => t.id === data.id);
            if (editItem) {
                editItem.title = data.newTitle;
            }
            break;

        case 'NOOP':
            break;

        default:
            return model;
    }

    return newModel;
}

function sortTodos(todos) {
    return [...todos].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
    });
}

function render_item(item) {
    const liClass = item.done ? 'completed' : '';

    let dateHtml = '';
    let dateClass = 'date-normal';
    if (item.dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(item.dueDate);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) dateClass = 'date-overdue';
        else if (diffDays === 0) dateClass = 'date-soon';
        else if (diffDays <= 3) dateClass = 'date-today';

        const formattedDate = due.toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'short'
        });
        dateHtml = `<span class="due-date ${dateClass}">📅 ${formattedDate}</span>`;
    }

    const dateWrapper = document.createElement('span');
    dateWrapper.className = 'due-date-wrapper';
    dateWrapper.innerHTML = dateHtml;

    const labelEl = document.createElement('label');
    labelEl.textContent = item.title;
    labelEl.dataset.id = item.id;

    const liEl = document.createElement('li');
    liEl.className = liClass;
    liEl.dataset.id = item.id;
    liEl.id = item.id;

    const viewDiv = document.createElement('div');
    viewDiv.className = 'view';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'toggle';
    checkbox.checked = item.done;
    checkbox.onclick = () => window.signal('TOGGLE', item.id);
    viewDiv.appendChild(checkbox);

    viewDiv.appendChild(labelEl);
    viewDiv.appendChild(dateWrapper);

    const destroyBtn = document.createElement('button');
    destroyBtn.className = 'destroy';
    destroyBtn.onclick = () => window.signal('DELETE', item.id);
    viewDiv.appendChild(destroyBtn);

    liEl.appendChild(viewDiv);
    return liEl;
}

function render_main(model) {
    const display = model.todos.length > 0 ? 'block' : 'none';
    const allChecked = model.todos.every(t => t.done) && model.todos.length > 0;
    const checkedAttr = allChecked ? 'checked=true' : '';

    const sortedTodos = sortTodos(model.todos);
    const items = sortedTodos.map(item => render_item(item));

    const sectionEl = document.createElement('section');
    sectionEl.className = 'main';
    sectionEl.style.display = display;

    const toggleAll = document.createElement('input');
    toggleAll.type = 'checkbox';
    toggleAll.className = 'toggle-all';
    toggleAll.id = 'toggle-all';
    toggleAll.checked = allChecked;
    toggleAll.onclick = () => window.signal('TOGGLE_ALL');
    sectionEl.appendChild(toggleAll);

    const labelAll = document.createElement('label');
    labelAll.htmlFor = 'toggle-all';
    labelAll.textContent = 'Mark all as complete';
    sectionEl.appendChild(labelAll);

    const ulEl = document.createElement('ul');
    ulEl.className = 'todo-list';
    items.forEach(item => ulEl.appendChild(item));
    sectionEl.appendChild(ulEl);

    return sectionEl;
}

function render_footer(model) {
    const activeTodos = model.todos.filter(t => !t.done);
    const count = activeTodos.length;
    const completedTodos = model.todos.filter(t => t.done);
    const display = model.todos.length > 0 ? 'block' : 'none';

    const countText = count === 1 ? 'item left' : 'items left';
    const clearDisplay = completedTodos.length > 0 ? 'block' : 'none';

    const allSelected = model.hash === '#/' ? 'selected' : '';
    const activeSelected = model.hash === '#/active' ? 'selected' : '';
    const completedSelected = model.hash === '#/completed' ? 'selected' : '';

    return footer(['class=footer', `style=display:${display}`], [
        span(['class=todo-count'], [
            strong(['id=count'], [text(count)]),
            text(` ${countText}`)
        ]),
        ul(['class=filters'], [
            li([], [
                a(['href=#/', `class=${allSelected}`, `onclick=signal('SET_HASH', '#/')`], ['All'])
            ]),
            li([], [
                a(['href=#/active', `class=${activeSelected}`, `onclick=signal('SET_HASH', '#/active')`], ['Active'])
            ]),
            li([], [
                a(['href=#/completed', `class=${completedSelected}`, `onclick=signal('SET_HASH', '#/completed')`], ['Completed'])
            ])
        ]),
        button(['class=clear-completed', `style=display:${clearDisplay}`, `onclick=signal('CLEAR_COMPLETED')`], ['Clear completed'])
    ]);
}

function view(model) {
    let filteredTodos = model.todos;
    if (model.hash === '#/active') {
        filteredTodos = model.todos.filter(t => !t.done);
    } else if (model.hash === '#/completed') {
        filteredTodos = model.todos.filter(t => t.done);
    }

    const filteredModel = {
        todos: filteredTodos,
        hash: model.hash
    };

    return section(['class=todoapp'], [
        header(['class=header'], [
            h1([], ['todos']),
            div(['class=input-row'], [
                input(['class=new-todo', 'id=new-todo', 'placeholder=What needs to be done?', 'autofocus=true'], []),
                input(['class=new-date', 'id=new-date', 'type=date'], []),
                button(['class=add-btn', 'id=add-btn'], ['➕'])
            ])
        ]),
        render_main(filteredModel),
        render_footer(model)
    ]);
}

function subscriptions(model) {
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash || '#/';
        window.signal('SET_HASH', hash);
    });

    function addTaskFromInputs() {
        const input = document.getElementById('new-todo');
        const dateInput = document.getElementById('new-date');
        if (!input) return;

        const text = input.value.trim();
        if (!text) {
            alert('Напиши задачу, брат!');
            return;
        }

        const dueDate = dateInput ? dateInput.value : null;
        window.signal('ADD', { title: text, dueDate: dueDate });
        input.value = '';
        if (dateInput) dateInput.value = '';
        input.focus();
    }

    function startEditing(id) {
        const task = window.__model.todos.find(t => t.id === id);
        if (!task || task.done) return;

        const li = document.getElementById(id);
        if (!li) return;

        const view = li.querySelector('.view');
        if (!view) return;

        const label = view.querySelector('label');
        if (!label) return;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-input';
        input.value = task.title;
        input.dataset.id = id;

        const wrapper = document.createElement('div');
        wrapper.className = 'edit-wrapper';
        wrapper.appendChild(input);
        view.replaceChild(wrapper, label);

        setTimeout(() => {
            input.focus();
            input.select();
        }, 10);

        input.onkeydown = function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const trimmed = input.value.trim();
                if (!trimmed) {
                    window.signal('DELETE', id);
                } else {
                    window.signal('EDIT_TASK', { id: id, newTitle: trimmed });
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                // Отменяем редактирование — возвращаем label
                view.replaceChild(label, wrapper);
            }
        };

        input.onblur = function() {
            setTimeout(() => {
                if (document.activeElement !== input) {
                    const trimmed = input.value.trim();
                    if (!trimmed) {
                        window.signal('DELETE', id);
                    } else {
                        window.signal('EDIT_TASK', { id: id, newTitle: trimmed });
                    }
                }
            }, 150);
        };
    }

    const appContainer = document.getElementById('app');
    if (appContainer) {
        if (appContainer._clickHandler) {
            appContainer.removeEventListener('click', appContainer._clickHandler);
            appContainer.removeEventListener('keydown', appContainer._keyHandler);
            appContainer.removeEventListener('dblclick', appContainer._dblClickHandler);
        }

        function clickHandler(e) {
            if (e.target.closest('#add-btn')) {
                addTaskFromInputs();
            }
        }

        function keyHandler(e) {
            const target = e.target;
            if (target.closest('#new-todo') && e.key === 'Enter') {
                e.preventDefault();
                addTaskFromInputs();
            }
        }

        function dblClickHandler(e) {
            const view = e.target.closest('.view');
            if (!view) return;
            
            const label = view.querySelector('label');
            if (label && (e.target === label || label.contains(e.target))) {
                const li = view.closest('li');
                if (li) {
                    const id = parseInt(li.dataset.id);
                    startEditing(id);
                }
            }
        }

        appContainer._clickHandler = clickHandler;
        appContainer._keyHandler = keyHandler;
        appContainer._dblClickHandler = dblClickHandler;

        appContainer.addEventListener('click', clickHandler);
        appContainer.addEventListener('keydown', keyHandler);
        appContainer.addEventListener('dblclick', dblClickHandler);
    }
}

if (typeof window !== 'undefined') {
    window.update = update;
    window.view = view;
    window.model = initial_model;
    window.render_item = render_item;
    window.render_main = render_main;
    window.render_footer = render_footer;
    window.subscriptions = subscriptions;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        model: initial_model,
        update: update,
        view: view,
        render_item: render_item,
        render_main: render_main,
        render_footer: render_footer,
        subscriptions: subscriptions
    };
}