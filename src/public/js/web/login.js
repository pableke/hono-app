
import Form from "../components/Form.js";
import nav from "../components/Navigation.js";

function fnLogin() { // Script id
    const formSignin = new Form("#signin"); // instance
    formSignin.submit(ev => {
        formSignin.send().then(nav.redirect); // Access allowed
        ev.preventDefault();
    });

    // Register handler for navigation
    nav.setScript("login-js", fnLogin);
}

// Register event on page load and export default handler
document.addEventListener("DOMContentLoaded", fnLogin);
export default fnLogin;
