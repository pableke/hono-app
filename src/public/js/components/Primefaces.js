
import alerts from "./Alerts.js";

const PARAMS = []; // params container
function param(name, value) {
    PARAMS.splice(0, PARAMS.length, { name, value }); // reset array
    return PARAMS;
}
function params(data) {
    PARAMS.splice(0, PARAMS.length); // reset array
    for (const name in data) // Object to params
        PARAMS.push({ name, value: data[name] });
    return PARAMS;
}
// p:remoteCommand server call
function send(action, params) {
    alerts.loading(); // Show loading frame
    const fnCall = window[action];
    fnCall(params); // call server
}
function sendId(action, id) { send(action, param("id", id)); }
function sendTerm(action, term) { send(action, param("term", term)); }
function sendIndex(action, index) { send(action, param("i", index)); }
function fetch(action, data) { send(action, params(data)); }

function datalist(form, select, input, opts) {
    opts = opts || {}; // Init. options
    const fnChange = opts.onChange || globalThis.void; // fired on load event
    const fnReset = opts.onReset || globalThis.void; // fired on reset event

    input = form.getInput(input); // get input element
    opts.onChange = item => { // fired on load event
        input.value = item.value ?? item; // item object or simple string
        fnChange(input.value);
    }
    opts.onReset = () => { // fired on reset event
        input.value = "";
        fnReset();
    };
    return form.setDatalist(select, opts);
}

function multiNameInput(form, main, inputs) {
    main = form.getInput(main);
    inputs = form.getInputs(inputs);

    inputs.forEach(el => {
        el.addEventListener("change", () => {
            main.value = el.value;
        });
        el.value = main.value;
    });
    return this;
}

export default {
    param, params, 
    send, sendId, sendTerm, sendIndex, fetch,
    datalist, multiNameInput
}
