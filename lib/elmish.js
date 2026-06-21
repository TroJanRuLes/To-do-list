function h(tag, attrs = [], children = []) {
    const el = document.createElement(tag);
    attrs.forEach(attr => {
        const [key, value] = attr.split('=');
        if (key && value) {
            el.setAttribute(key, value);
        }
    });
    children.forEach(child => {
        if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
        } else if (child instanceof HTMLElement) {
            el.appendChild(child);
        } else if (Array.isArray(child)) {
            child.forEach(c => {
                if (typeof c === 'string') {
                    el.appendChild(document.createTextNode(c));
                } else if (c instanceof HTMLElement) {
                    el.appendChild(c);
                }
            });
        }
    });
    return el;
}

function div(attrs, children) { return h('div', attrs, children); }
function span(attrs, children) { return h('span', attrs, children); }
function p(attrs, children) { return h('p', attrs, children); }
function h1(attrs, children) { return h('h1', attrs, children); }
function ul(attrs, children) { return h('ul', attrs, children); }
function li(attrs, children) { return h('li', attrs, children); }
function button(attrs, children) { return h('button', attrs, children); }
function input(attrs, children) { return h('input', attrs, children); }
function label(attrs, children) { return h('label', attrs, children); }
function a(attrs, children) { return h('a', attrs, children); }
function footer(attrs, children) { return h('footer', attrs, children); }
function section(attrs, children) { return h('section', attrs, children); }
function header(attrs, children) { return h('header', attrs, children); }
function strong(attrs, children) { return h('strong', attrs, children); }
function text(str) { return str; }

function empty(el) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
}

function mount(model, update, view, elementId, subscriptions) {
    const root = document.getElementById(elementId);
    if (!root) {
        console.error('Элемент с id "' + elementId + '" не найден!');
        return;
    }

    window.__model = model;

    window.signal = function(action, data) {
        const newModel = update(action, model, data);
        if (newModel !== model) {
            Object.assign(model, newModel);
            render();
            try {
                localStorage.setItem('elmish_store', JSON.stringify(model));
            } catch (e) {}
        }
    };

    function render() {
        const scrollPos = window.scrollY;
        empty(root);
        const newView = view(model);
        root.appendChild(newView);
        requestAnimationFrame(() => {
            window.scrollTo(0, scrollPos);
        });
    }

    try {
        const saved = localStorage.getItem('elmish_store');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(model, parsed);
        }
    } catch (e) {}

    if (subscriptions) {
        subscriptions(model);
    }

    render();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        h, div, span, p, h1, ul, li, button, input, label, a, footer,
        section, header, strong, text, empty, mount
    };
}

if (typeof window !== 'undefined') {
    window.elmish = {
        h, div, span, p, h1, ul, li, button, input, label, a, footer,
        section, header, strong, text, empty, mount
    };
    window.div = div;
    window.span = span;
    window.p = p;
    window.h1 = h1;
    window.ul = ul;
    window.li = li;
    window.button = button;
    window.input = input;
    window.label = label;
    window.a = a;
    window.footer = footer;
    window.section = section;
    window.header = header;
    window.strong = strong;
    window.text = text;
    window.empty = empty;
    window.mount = mount;
}