
import solicitud from "./Solicitud.js";
import i18n from "../i18n/presto/langs.js";

function Partida(presto) {
	const self = this; //self instance
    const NO_APLICA = "N/A"; //default table float
    const ERR_ORGANICA = "No ha seleccionado correctamente la orgánica";

    let data; // Current presto data type
    this.getData = () => data;
    this.setData = partida => { data = partida; return self; }

    this.isAnticipada = partida => (partida.mask & 4);
    this.isExcedida = partida => ((presto.isAnt() || (partida.e == "642")) && Number.isNumber(partida.ih) && ((partida.ih + .01) < partida.imp));
    this.isAfectada = mask => (mask & 1); // Es afectada? Si/No

    this.thead = () => {
        const output = presto.isPartidaExt() ? '<th>Prev. Ingresos (A)</th><th>GG &#37; (B)</th><th>Max. Habilitar (C=A-B)</th><th>Crédito Habilitado (D)</th><th>Margen (E=C-D)</th>' : "";
        return `<tr>
            <th></th>
            <th>Ej.</th>
            <th>Orgánica</th>
            <th class="hide-sm">Descripción Orgánica</th>
            <th class="hide-sm">FA</th>
            <th>Eco.</th>
            <th class="hide-sm">Descripción Económica</th>
            ${output}
            <th>Importe</th>
            <th></th>
        </tr>`;
    }
    this.row = (data, status, resume) => {
        resume.imp += data.imp; // sum
        const excedido = self.isExcedida(data) ? '<span class="text-warn text-xl" title="La cantidad solicitada excede el margen registrado por el Buzón de Ingresos">&#9888;</span>' : "";
        const anticipada = self.isAnticipada(data) ? '<span class="text-xl" title="Este contrato ha gozado de anticipo en algún momento">&#65;</span>' : "";
        const doc030 = presto.is030() ? '<a href="#doc030" class="fal fa-money-bill-alt action action-green row-action" title="Asociar los datos del documento 030"></a>' : "";
        const remove = (presto.isEditable() && !presto.isAfc()) ? '<a href="#remove" class="fas fa-times action action-red row-action" title="Desasociar partida"></a>' : "";

        let output = "";
        if (presto.isPartidaExt()) {
            output = `<td class="text-right">${i18n.isoFloat(data.ing) || NO_APLICA} €</td>
                        <td class="text-right">${i18n.isoFloat(data.gg) || NO_APLICA} €</td>
                        <td class="text-right">${i18n.isoFloat(data.mh) || NO_APLICA} €</td>
                        <td class="text-right">${i18n.isoFloat(data.ch) || NO_APLICA} €</td>
                        <td class="text-right">${i18n.isoFloat(data.ih) || NO_APLICA} €</td>`;
        }
        return `<tr class="tb-data">
            <td class="text-center">${excedido}${anticipada}</td>
            <td class="text-center">${data.ej}</td>
            <td>${data.o}</td>
            <td class="hide-sm">${data.dOrg}</td>
            <td class="text-center hide-sm">${i18n.boolval(self.isAfectada(data.omask))}</td>
            <td class="text-center">${data.e}</td>
            <td class="hide-sm">${data.dEco}</td>
            ${output}
            <td class="text-right">${i18n.isoFloat(data.imp)} €</td>
            <td class="text-center">${doc030}${remove}</td>
        </tr>`;
    }
    this.tfoot = resume => {
        const output = presto.isPartidaExt() ? '<td></td><td></td><td></td><td></td><td></td>' : "";
        return `<tr>
            <td colspan="3">Partidas: ${resume.size}</td>
            <td class="hide-sm"></td><td class="hide-sm"></td><td></td><td class="hide-sm"></td>
            ${output}
            <td class="text-right">${i18n.isoFloat(resume.imp)} €</td><td></td>
        </tr>`;
    }

    this.validate = data => {
        let ok = i18n.reset().isKey("acOrgInc", data.idOrgInc, ERR_ORGANICA); // autocomplete required key
        ok = i18n.isKey("idEcoInc", data.idEcoInc, "Debe seleccionar una económica") && ok; // select required number
        ok = i18n.gt0("impInc", data.impInc) && ok; // float number > 0
        return ok || i18n.reject("No ha seleccionada correctamente la partida a incrementar.");
    }
    this.validate030 = data030 => {
        if (!data) // Debo cargar previamente la partida seleccionada
            return i18n.reject("No se ha encontrado la partida asociada al documento 080.");
        let ok = i18n.reset().isKey("acOrg030", data030.idOrg030, ERR_ORGANICA); // autocomplete required key
        ok = i18n.isKey("idEco030", data030.idEco030, "Debe seleccionar una económica") && ok; // select required number
        ok = i18n.gt0("imp030", data030.imp030) && ok; // float number > 0
        const label = data030.acOrg030?.split(" - "); // Code separator
        ok = label ? ok : !i18n.setError(ERR_ORGANICA, "acOrg030");
        if (!ok)
            return i18n.reject("No ha seleccionada correctamente la aplicación para el DC 030.");
        if (data.imp < data030.imp030)
            return !i18n.setInputError("imp030", "errExceeded", "El importe del documento 030 excede al del 080.");
        // If ok => update partida a incrementar
        data.idOrg030 = +data030.idOrg030;
        [ data.o030, data.dOrg030 ] = label;
        data.idEco030 = data030.idEco030;
        data.imp030 = data030.imp030;
        return true;
    }
}

function Partidas(presto) {
	const self = this; //self instance
    const partida = new Partida(presto);

    let data, resume; // Current data table
    this.getData = () => data;
    this.setPartidas = partidas => {
        data = partidas;
        return self;
    }
    this.setData = table => {
        resume = table.getResume();
        return self.setPartidas(table.getData());
    }

    this.getImporte = () => resume.imp;
    this.getPartida = () => partida;

    this.setPrincipal = () => {
        data.sort((a, b) => (b.imp - a.imp)); //orden por importe desc.
        data[0].mask |= 1; //marco la primera como principal
        return self;
    }

    this.validate = () => { // Todas las solicitudes tienen partidas a incrementar
        return data.length || !i18n.setInputError("acOrgInc", "errRequired", "Debe seleccionar al menos una partida a incrementar");
    }
    this.validatePartida = partida => { // compruebo si la partida existía previamente
        return !data.find(row => ((row.o == partida.o) && (row.e == partida.e)));
    }
}

function Presto() {
	const self = this; //self instance
    const partidas = new Partidas(self);

    let _data; // Current instance
    this.setData = data => {
        _data = data; // Update instance
        solicitud.setData(data);
        data.titulo = i18n.getItem("descTipos", data.tipo - 1);
        return self;
    }

    this.getPartidas = () => partidas;
    this.getPartida = partidas.getPartida;

    this.isTcr = () => (solicitud.getTipo() == 1);
    this.isFce = () => (solicitud.getTipo() == 6);
    this.isL83 = () => (solicitud.getTipo() == 3);
    this.isGcr = () => (solicitud.getTipo() == 4);
    this.isAnt = () => (solicitud.getTipo() == 5);
    this.isAfc = () => (solicitud.getTipo() == 8);
    this.is030 = () => (solicitud.isUae() && (self.isGcr() || self.isAnt()));

    this.isDisabled = solicitud.isDisabled;
    this.isEditable = solicitud.isEditable;
    this.isFirmable = solicitud.isFirmable;
    this.isRechazable = solicitud.isRechazable;
	this.isEditableUae = solicitud.isEditableUae;
	this.isEjecutable = () => ((solicitud.isUae() && solicitud.isPendiente()) || solicitud.isEjecutable());
	this.isIntegrable = () => (!self.isAfc() && solicitud.isIntegrable());
	this.isUrgente = solicitud.isUrgente;
	this.isImpCd = () => (self.isEditable() && !self.isAnt());

    this.isPartidaDec = () => (self.isTcr() || self.isL83() || self.isAnt() || self.isAfc());
	this.isMultipartida = () => (self.isTcr() || self.isFce() || self.isGcr());
    this.isPartidaExt = () => (self.isGcr() || self.isAnt());
    this.isDisableEjInc = () => (self.isDisabled() || self.isTcr() || self.isFce());
    this.isAutoLoadImp = () => (self.isL83() || self.isAnt() || self.isAfc());
    this.isAutoLoadInc = () => (self.isL83() || self.isAnt());
    this.isAnticipada = () => (_data.mask & 4);
    this.isExcedida = () => (_data.mask & 8);

    this.getSubtipo = solicitud.getSubtipo;
    this.setSubtipo = solicitud.setSubtipo;
    this.getMemo = () => _data.memo;

    this.row = data => {
        self.setData(data); // initialize 
        const otras = (data.mask & 1) ? "<span> (y otras)</span>" : ""; // multipartida

        let info = '<td></td>';
        if (self.isUrgente())
            info = `<td class="text-center text-red text-xl" title="${data.name}: ${data.extra}">&#33;</td>`;
        if ((solicitud.isUae() || solicitud.isOtri()) && self.isAnticipada())
            info = '<td class="text-center text-xl" title="Este contrato ha gozado de anticipo en algún momento">&#65;</td>';
        if ((solicitud.isUae() || solicitud.isOtri()) && self.isExcedida())
            info = '<td class="text-center text-warn text-xl" title="La cantidad solicitada excede el margen registrado por el Buzón de Ingresos">&#9888;</td>';

        let acciones = '<a href="#rcView" class="row-action"><i class="fas fa-search action action-blue"></i></a>';
        if (self.isFirmable())
            acciones += `<a href="#rcFirmar" class="row-action firma-${data.id}" data-confirm="msgFirmar"><i class="fas fa-check action action-green"></i></a>
                         <a href="#tab-11" class="row-action firma-${data.id}"><i class="fas fa-times action action-red"></i></a>`;
        if (!self.isEditable())
            acciones += '<a href="#rcReport" class="row-action"><i class="fal fa-file-pdf action action-red"></i></a>';
        if (self.isIntegrable())
            acciones += '<a href="#rcIntegrar" class="row-action" data-confirm="msgIntegrar"><i class="far fa-save action action-blue"></i></a>';
        if (self.isEjecutable())
            acciones += '<a href="#rcUxxiec" class="row-action"><i class="fal fa-cog action action-green"></i></a>';
        if (solicitud.isAdmin())
            acciones += '<a href="#rcEmails" class="row-action"><i class="fal fa-mail-bulk action action-blue"></i></a><a href="#rcRemove" class="row-action" data-confirm="msgRemove"><i class="fal fa-trash-alt action action-red"></i></a>';

        return `<tr class="tb-data">
            ${info}
            <td class="text-center"><a href="#rcView" class="row-action">${data.codigo}</a></td>
            <td class="hide-sm">${data.titulo}</td>
            <td class="${solicitud.getStyleByEstado(data)} estado-${data.id}">${solicitud.getDescEstado()}</td>
            <td class="text-center">${solicitud.getFirma().myFlag(data.fmask, data.info)}</td>
            <td class="hide-sm">${data.sig || ""}</td>
            <td title="${data.oIncDesc}">${data.orgInc}${otras}</td>
            <td class="text-center" title="${data.eIncDesc}">${data.ecoInc}</td>
            <td class="text-right">${i18n.isoFloat(data.imp)} €</td>
            <td class="text-center hide-xs">${i18n.isoDate(data.fCreacion)}</td>
            <td class="hide-sm">${data.name}</td>
            <td class="hide-md">${data.memo}</td>
            <td class="text-right">${acciones}</td>
        </tr>`;
    }
    this.tfoot = resume => `<tr><td colspan="99">Solicitudes: ${resume.size}</td></tr>`;

    this.validate = data => {
        let ok = i18n.reset().isKey("acOrgDec", data.idOrgDec, "Debe seleccionar la orgánica que disminuye"); // autocomplete required key
        ok = i18n.isKey("idEcoDec", data.idEcoDec, "Debe seleccionar la económica que disminuye") && ok; // select required number
        ok || i18n.setError("No ha seleccionada correctamente la partida que disminuye."); // Main form message

        const imp = data.impDec ?? 0; // los importes pueden ser nulos segun el tipo de presto
        if (self.isPartidaDec() && (partidas.getImporte() != imp)) // Valido los importes a decrementar e incrementar
            ok = !i18n.setInputError("impDec", "notValid", "¡Los importes a decrementar e incrementar no coinciden!");
        const cd = self.isAnt() ? imp : (data.cd ?? 0); // los anticipos no validan el CD
        ok = (imp > cd) ? !i18n.setInputError("impDec", "errExceeded", "El importe de la partida que disminuye supera el crédito disponible") : ok;
        ok = i18n.size("memo", data.memo) ? ok : i18n.reject("Debe asociar una memoria justificativa a la solicitud."); // Required string
        if (data.urgente == "2") { // Solicitud urgente
            ok = i18n.size("extra", data.extra) ? ok : i18n.reject("Debe indicar un motivo para la urgencia de esta solicitud."); // Required string
            ok = i18n.geToday("fMax", data.fMax) ? ok : i18n.reject("Debe indicar una fecha maxima de resolución para esta solicitud."); // Required date
        }
        return partidas.validate() && ok;
    }
}

export default new Presto();
