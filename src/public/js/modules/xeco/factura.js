
import Form from "../../components/Form.js";
import tabs from "../../components/Tabs.js";
import pf from "../../components/Primefaces.js";
import i18n from "../../i18n/langs.js";

import factura from "../../model/xeco/Factura.js";
import uxxiec from "../../model/xeco/Solicitud.js";
import solicitudes from "./xeco.js";
import fiscal from "../../data/fiscal.js";

pf.ready(() => {
	const linea = factura.getLinea();

	const fnCalcIva = iva => {
		factura.setIva(iva);
		const resume = lineas.getResume();
		const impIva = resume.imp * (iva / 100);
		formFact.text("#imp-iva", i18n.isoFloat(impIva) + " €")
				.text("#imp-total", i18n.isoFloat(resume.imp + impIva) + " €");
	}
	const updateSujeto = sujeto => {
		factura.setSujeto(sujeto);
		formFact.setVisible(".grupo-exento", factura.isExento());
	}
	const updateView = subtipo => {
		factura.setSubtipo(subtipo); // actualizo el nuevo subtipo
		const item = acTercero.getCurrentItem(); // tercero seleccionado
		if (!item) return; // primer acceso

		let keyEco = "cp"; // por defecto = carta de pago
		if (factura.isFacturable()) { // tipo de solicitud
			keyEco = "c" + item.imp; //caracter => persona fisica=1, persona juridica=2, est. publico=3
			keyEco += (item.int & 256) ? "ep" : "no"; // Establecimiento permanente
			const ep_es = (item.int & 128) || (item.int & 256); //Establecimiento permanente o Residente
			// Residente en la peninsula=es, ceuta-melillacanarias=np, comunitario=ue, resto del mundo=zz
			keyEco += ep_es ? ((item.int & 2048) ? "es" : "np") : ((item.int & 2) ? "ue" : "zz");
		}

		const data = fiscal[keyEco + factura.getSubtipo()] || fiscal.default;
        formFact.setData(data, ".ui-fiscal").setval("#nifTercero", acTercero.getCode()).setVisible("#ac-recibo", factura.isRecibo());
		updateSujeto(data.sujeto);
		fnCalcIva(data.iva);
	}
	const updateFace = face => {
		factura.setFace(face);
		formFact.text(".grupo-gestor > .label", factura.isPlataforma() ? "Nombre de la plataforma:" : "Órgano Gestor:")
				.setVisible(".grupo-face", factura.isFace()).setVisible(".grupo-gestor", factura.isFace() || factura.isPlataforma());
	}

	/*** FORMULARIO PRINCIPAL ***/
    const formFact = new Form("#xeco-fact");
    solicitudes(factura, formFact); // init. actions

	const delegaciones = pf.datalist(formFact, "#delegacion", "#idDelegacion", { emptyOption: "Seleccione una delegación" });
	const acTercero = formFact.setAutocomplete("#acTercero", {
		delay: 500, //milliseconds between keystroke occurs and when a search is performed
		minLength: 5, //reduce matches
		source: term => pf.sendTerm("rcFindTercero", term),
		render: item => item.label,
		select: item => { pf.sendId("rcDelegaciones", item.value); return item.value },
		afterSelect: () => updateView(factura.getSubtipo()),
		onReset: delegaciones.reset
	});
	const acOrganica = formFact.setAcItems("#acOrganica", term => pf.sendTerm("rcFindOrganica", term));
	const acRecibo = formFact.setAcItems("#acRecibo", term => pf.sendTerm("rcFindRecibo", term));
	formFact.onChangeInput("#subtipo", ev => updateView(+ev.target.value))
			.onChangeInput("#sujeto", ev => updateSujeto(+ev.target.value))
			.onChangeInput("#face", ev => updateFace(+ev.target.value));

	const lineas = formFact.setTable("#lineas-fact", {
        msgEmptyTable: "No existen conceptos asociados a la solicitud",
        beforeRender: resume => { resume.imp = 0; resume.iva = factura.getIva(); },
        onRender: linea.row,
        onFooter: linea.tfoot,
		afterRender: resume => {
			const opts = { onChange: fnCalcIva };
			pf.datalist(formFact, "#iva", "#ivaPF", opts).setLabels([0, 4, 10, 21]).setValue(resume.iva);
		}
		//ivaChange: el => fnCalcIva(+el.value)
    });
	formFact.addClick("a#add-linea", ev => {
		const data = formFact.isValid(linea.validate, ".ui-linea");
		if (data) {
			lineas.push(data); // save container
			formFact.restart("#desc").setval("#imp").setval("#memo", lineas.getItem(0).desc);
		}
		ev.preventDefault();
	});

    window.loadDelegaciones = (xhr, status, args) => {
        if (pf.showAlerts(xhr, status, args))
            delegaciones.setItems(JSON.read(args.delegaciones));
    }

	window.viewFactura = (xhr, status, args) => {
        if (!pf.showAlerts(xhr, status, args))
            return false; // Server error
		const data = JSON.read(args.fact);
        factura.setData(data); // Load data-model before view
		formFact.setData(data).setval("#nifTercero", data.nif).readonly(factura.isDisabled())
				.setVisible(".insert-only", factura.isEditable()).setVisible(".update-only", factura.isDisabled())
				.setVisible(".firmable-only", factura.isFirmable()).setVisible(".rechazable-only", factura.isRechazable())
				.setVisible(".show-recibo", factura.isRecibo()).setVisible(".show-factura", factura.isFacturable()).setVisible(".show-cp", factura.isCartaPago())
				.setVisible(".show-factura-uae", uxxiec.isUae() && factura.isFacturable()).setVisible(".show-uae", uxxiec.isUae())
				.setVisible(".show-gestor", factura.isFace() || factura.isPlataforma()).setVisible(".show-face", factura.isFace())
				.setVisible(".show-gaca", factura.isFirmaGaca());
		delegaciones.setItems(JSON.read(args.delegaciones)); // cargo las delegaciones
		lineas.render(JSON.read(args.data)); // Load conceptos and iva input
		formFact.readonly(!factura.isEditableUae(), ".editable-uae"); // disable iva input
		acTercero.setValue(data.idTer, data.nif + " - " + data.tercero);
        acOrganica.setValue(data.idOrg, data.org + " - " + data.descOrg);
        acRecibo.setValue(data.idRecibo, data.acRecibo);
		updateSujeto(data.sujeto); // update sujeto inputs group
		updateFace(data.face); // update face inputs group
        tabs.render(".load-data", data).showTab(1);
	}
	window.fnSend = () => {
		factura.setLineas(lineas);
		if (formFact.isValid(factura.validate)) {
			formFact.saveTable("#lineas-json", lineas);
			return i18n.confirm("msgSend") && loading();
		}
		return false;
	}
	/*** FORMULARIO PRINCIPAL ***/
});
