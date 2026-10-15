import {LitElement,css,html} from 'lit';
import type {exampleSource} from './modifier-example-source';
import {downloadStarter} from './starter-files';

export class FdlStarterDownload extends LitElement {
    static properties={source:{attribute:false},disabled:{type:Boolean},label:{type:String},busy:{state:true},error:{state:true}};
    source?:ReturnType<typeof exampleSource>;
    disabled=false;
    label='Download runnable example';
    private busy=false;
    private error='';
    private loadAssets=async()=> (await import('virtual:fdl-starter')).default;
    private download=async()=>{
        if(this.busy || this.disabled || !this.source) return;
        const source=this.source;
        this.busy=true;this.error='';
        try { downloadStarter(source,await this.loadAssets()); }
        catch { this.error='Could not prepare the example. Please try again.'; }
        finally { this.busy=false; }
    };
    render(){return html`<button ?disabled=${this.disabled || this.busy || !this.source} aria-busy=${String(this.busy)} @click=${this.download}>${this.busy?'Preparing example…':this.error?'Try download again':this.label}</button><span role="status">${this.busy?'Preparing your runnable example.':this.error}</span>`;}
    static styles=css`:host{display:inline-block}button{font:inherit;min-height:44px;padding:8px 16px;border:1px solid #94a3b8;border-radius:4px;background:white;color:#1d4ed8;cursor:pointer}button:disabled{opacity:.6;cursor:default}button:focus-visible{outline:3px solid #2563eb;outline-offset:3px}span:not(:empty){display:block;margin-top:8px;font-size:.875rem}`;
}
customElements.define('fdl-starter-download',FdlStarterDownload);
