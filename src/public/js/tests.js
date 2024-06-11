
import nav from "./components/Navigation.js";
import MultiSelectCheckbox from "./components/MultiSelectCheckbox.js";
//import menu from "./components/Menu.js";
//import menus from "./data/menus.js";
import i18n from "./i18n/langs.js";

//const menuTree = menus.filter(node => (node.tipo == 1)).sort((a, b) => (a.orden - b.orden));

nav.ready(() => {
    const html = document.documentElement;
    const langs = document.getElementById("languages");
    const link = langs.querySelector("a#" + i18n.get("lang")); // Language selector
    langs.firstElementChild.firstElementChild.src = link.firstElementChild.src;

    /* multioptions */
    const options = new MultiSelectCheckbox(".multi-options", { name: "animales" });
    const animales = [ { value: 1, label: "Perro" }, { value: 2, label: "Gato" }, { value: 3, label: "Girafa" }, { value: 4, label: "Leon" }, { value: 5, label: "Tiburón" } ]
    options.setItems(animales);

    const menuHTML = document.querySelector("ul.menu");
    //menuHTML.innerHTML = menuHTML.innerHTML || menu.html(menuTree);
    menuHTML.classList.add("active");

    // toggle phone menu
    const menuToggleBtn = document.querySelector("#menu-toggle");
    menuToggleBtn.addEventListener("click", ev => {
        menuHTML.closest("nav").toggle("active");
        menuToggleBtn.children.toggle();
    });

    // On page load or when changing themes, best to add inline in `head` to avoid FOUC
    const themeToggleBtn = document.querySelector("#theme-toggle");
    if ((localStorage.getItem("color-theme") === "dark") || (!("color-theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        html.classList.add("dark");
        themeToggleBtn.lastElementChild.show(); // ligth icon
    }
    else {
        html.classList.remove("dark");
        themeToggleBtn.firstElementChild.show(); // dark icon
    }
    themeToggleBtn.addEventListener("click", function() {
        // toggle icons inside button
        themeToggleBtn.children.toggle();
    
        // if set via local storage previously
        if (localStorage.getItem("color-theme")) {
            if (localStorage.getItem("color-theme") === "light") {
                html.classList.add("dark");
                localStorage.setItem("color-theme", "dark");
            } else {
                html.classList.remove("dark");
                localStorage.setItem("color-theme", "light");
            }
        }
        else { // if NOT set via local storage previously
            if (html.classList.contains("dark")) {
                html.classList.remove("dark");
                localStorage.setItem("color-theme", "light");
            } else {
                html.classList.add("dark");
                localStorage.setItem("color-theme", "dark");
            }
        }
    });

    nav.setClick(document);
});
