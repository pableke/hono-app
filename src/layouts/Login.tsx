
import { Layout } from "./Main";
import { InputText } from "../components/Inputs";
import { ButtonSubmit } from "../components/Buttons";
import i18n from "../i18n/langs.js";

export const contact = (props: any) => {
    // TODO tab to contact mail
    return (
        <div></div>
    );
}

export const remember = (props: any) => {
    // TODO tab to remember pass
    return (
        <div></div>
    );
}

export const Form = (props: any) => {
    return (
        <form id="signin" action="/signin" method="post">
            <div class="ui-blocks">
                <InputText name="login" required={true} label={i18n.get("lblLogin")} tabindex="1" placeholder="DNI, NIF or Email"/>
                <div class="ui-block-break"></div>
                <label class="ui-block-xl">
                    <div class="label required">{i18n.get("lblPass")}:</div>
                    <input type="password" id="pass" name="pass" class="ui-input" tabindex="2" placeholder="**********" />
                    <div class="ui-errtip"></div>
                </label>
            </div>
            <div class="navbar">
                <ButtonSubmit>Entrar</ButtonSubmit>
            </div>
        </form>
    );
}

export const Login = (props: any) => {
    return (
        <Layout>
            <Form/>
        </Layout>
    );
}
