
import nav from "../../../components/Navigation.js";
import Place from "../../../model/xeco/iris/Place.js";
import dieta from "../../../model/xeco/iris/Dieta.js";

const OPTIONS = {
    fields: [ "address_component", "formatted_address", "geometry", "name" ],
    types: [ "geocode", "establishment" ],
    strictBounds: false
};

window.initMap = function() {
    const salida = new Place(); // Place model instance
    const inputOrigen = document.getElementById("ac-origen");
    const origen = new google.maps.places.Autocomplete(inputOrigen, OPTIONS);
    const divAddress = document.querySelector(".address-components");
    const divDieta = document.querySelector(".dieta");

    const fnVisible = () => {
        const ok = origen.getPlace() && inputOrigen.value;
        divAddress.setVisible(ok);
        divDieta.setVisible(ok);
    }
    inputOrigen.focus();
    inputOrigen.addEventListener("search", fnVisible);
    inputOrigen.addEventListener("change", fnVisible);

    origen.addListener("place_changed", function() {
        const place = origen.getPlace();

        const AC = salida.setPlace(place).format(place, {});
        divAddress.render(AC).show();

        const data = dieta.getDieta(salida.getContry());
        divDieta.render(dieta.format(data, {})).show();

        console.log("CT=" + salida.isCartagena(), data, AC, place);
    });
}

function fnMaps() {
    if (nav.getScript("maps-js"))
        return window.initMap(); // API loaded
    // Create the script tag, set the appropriate attributes
    const script = document.createElement("script");
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBIlqxZkVg9GyjzyNzC0rrZiuY6iPLzTZI&libraries=places&callback=initMap";
    script.async = true; // Solicita al navegador que descargue y ejecute la secuencia de comandos de manera asíncrona, despues llamará a initMap
    script.defer = true; // Will execute the script after the document has been parsed
    document.head.appendChild(script); // Append the "script" element to "head"

    // Register handler for navigation
    nav.setScript("maps-js", fnMaps);
}

// Register event on page load and export default handler
document.addEventListener("DOMContentLoaded", fnMaps);
export default fnMaps;
