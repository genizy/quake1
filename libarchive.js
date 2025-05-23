/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const e = Symbol("Comlink.proxy"),
    t = Symbol("Comlink.endpoint"),
    n = Symbol("Comlink.releaseProxy"),
    r = Symbol("Comlink.finalizer"),
    i = Symbol("Comlink.thrown"),
    s = e => "object" == typeof e && null !== e || "function" == typeof e,
    a = new Map([
        ["proxy", {
            canHandle: t => s(t) && t[e],
            serialize(e) {
                const {
                    port1: t,
                    port2: n
                } = new MessageChannel;
                return o(e, t), [n, [n]]
            },
            deserialize: e => (e.start(), l(e))
        }],
        ["throw", {
            canHandle: e => s(e) && i in e,
            serialize({
                value: e
            }) {
                let t;
                return t = e instanceof Error ? {
                    isError: !0,
                    value: {
                        message: e.message,
                        name: e.name,
                        stack: e.stack
                    }
                } : {
                    isError: !1,
                    value: e
                }, [t, []]
            },
            deserialize(e) {
                if (e.isError) throw Object.assign(new Error(e.value.message), e.value);
                throw e.value
            }
        }]
    ]);

function o(e, t = globalThis, n = ["*"]) {
    t.addEventListener("message", (function s(a) {
        if (!a || !a.data) return;
        if (! function (e, t) {
                for (const n of e) {
                    if (t === n || "*" === n) return !0;
                    if (n instanceof RegExp && n.test(t)) return !0
                }
                return !1
            }(n, a.origin)) return void console.warn(`Invalid origin '${a.origin}' for comlink proxy`);
        const {
            id: l,
            type: u,
            path: p
        } = Object.assign({
            path: []
        }, a.data), h = (a.data.argumentList || []).map(v);
        let f;
        try {
            const t = p.slice(0, -1).reduce(((e, t) => e[t]), e),
                n = p.reduce(((e, t) => e[t]), e);
            switch (u) {
            case "GET":
                f = n;
                break;
            case "SET":
                t[p.slice(-1)[0]] = v(a.data.value), f = !0;
                break;
            case "APPLY":
                f = n.apply(t, h);
                break;
            case "CONSTRUCT":
                f = w(new n(...h));
                break;
            case "ENDPOINT": {
                const {
                    port1: t,
                    port2: n
                } = new MessageChannel;
                o(e, n), f = function (e, t) {
                    return g.set(e, t), e
                }(t, [t])
            }
            break;
            case "RELEASE":
                f = void 0;
                break;
            default:
                return
            }
        } catch (e) {
            f = {
                value: e,
                [i]: 0
            }
        }
        Promise.resolve(f).catch((e => ({
            value: e,
            [i]: 0
        }))).then((n => {
            const [i, a] = y(n);
            t.postMessage(Object.assign(Object.assign({}, i), {
                id: l
            }), a), "RELEASE" === u && (t.removeEventListener("message", s), c(t), r in e && "function" == typeof e[r] && e[r]())
        })).catch((e => {
            const [n, r] = y({
                value: new TypeError("Unserializable return value"),
                [i]: 0
            });
            t.postMessage(Object.assign(Object.assign({}, n), {
                id: l
            }), r)
        }))
    })), t.start && t.start()
}

function c(e) {
    (function (e) {
        return "MessagePort" === e.constructor.name
    })(e) && e.close()
}

function l(e, t) {
    return d(e, [], t)
}

function u(e) {
    if (e) throw new Error("Proxy has been released and is not useable")
}

function p(e) {
    return E(e, {
        type: "RELEASE"
    }).then((() => {
        c(e)
    }))
}
const h = new WeakMap,
    f = "FinalizationRegistry" in globalThis && new FinalizationRegistry((e => {
        const t = (h.get(e) || 0) - 1;
        h.set(e, t), 0 === t && p(e)
    }));

function d(e, r = [], i = function () {}) {
    let s = !1;
    const a = new Proxy(i, {
        get(t, i) {
            if (u(s), i === n) return () => {
                ! function (e) {
                    f && f.unregister(e)
                }(a), p(e), s = !0
            };
            if ("then" === i) {
                if (0 === r.length) return {
                    then: () => a
                };
                const t = E(e, {
                    type: "GET",
                    path: r.map((e => e.toString()))
                }).then(v);
                return t.then.bind(t)
            }
            return d(e, [...r, i])
        },
        set(t, n, i) {
            u(s);
            const [a, o] = y(i);
            return E(e, {
                type: "SET",
                path: [...r, n].map((e => e.toString())),
                value: a
            }, o).then(v)
        },
        apply(n, i, a) {
            u(s);
            const o = r[r.length - 1];
            if (o === t) return E(e, {
                type: "ENDPOINT"
            }).then(v);
            if ("bind" === o) return d(e, r.slice(0, -1));
            const [c, l] = m(a);
            return E(e, {
                type: "APPLY",
                path: r.map((e => e.toString())),
                argumentList: c
            }, l).then(v)
        },
        construct(t, n) {
            u(s);
            const [i, a] = m(n);
            return E(e, {
                type: "CONSTRUCT",
                path: r.map((e => e.toString())),
                argumentList: i
            }, a).then(v)
        }
    });
    return function (e, t) {
        const n = (h.get(t) || 0) + 1;
        h.set(t, n), f && f.register(e, t, e)
    }(a, e), a
}

function m(e) {
    const t = e.map(y);
    return [t.map((e => e[0])), (n = t.map((e => e[1])), Array.prototype.concat.apply([], n))];
    var n
}
const g = new WeakMap;

function w(t) {
    return Object.assign(t, {
        [e]: !0
    })
}

function y(e) {
    for (const [t, n] of a)
        if (n.canHandle(e)) {
            const [r, i] = n.serialize(e);
            return [{
                type: "HANDLER",
                name: t,
                value: r
            }, i]
        } return [{
        type: "RAW",
        value: e
    }, g.get(e) || []]
}

function v(e) {
    switch (e.type) {
    case "HANDLER":
        return a.get(e.name).deserialize(e.value);
    case "RAW":
        return e.value
    }
}

function E(e, t, n) {
    return new Promise((r => {
        const i = new Array(4).fill(0).map((() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16))).join("-");
        e.addEventListener("message", (function t(n) {
            n.data && n.data.id && n.data.id === i && (e.removeEventListener("message", t), r(n.data))
        })), e.start && e.start(), e.postMessage(Object.assign({
            id: i
        }, t), n)
    }))
}
class R {
    constructor(e, t, n, r, i) {
        this._name = e, this._size = t, this._path = n, this._lastModified = r, this._archiveRef = i
    }
    get name() {
        return this._name
    }
    get size() {
        return this._size
    }
    get lastModified() {
        return this._lastModified
    }
    extract() {
        return this._archiveRef.extractSingleFile(this._path)
    }
}

function b(e) {
    if (e instanceof File || e instanceof R || null === e) return e;
    const t = {};
    for (const n of Object.keys(e)) t[n] = b(e[n]);
    return t
}

function P(e, t = "") {
    const n = [];
    for (const r of Object.keys(e)) e[r] instanceof File || e[r] instanceof R || null === e[r] ? n.push({
        file: e[r] || r,
        path: t
    }) : n.push(...P(e[r], `${t}${r}/`));
    return n
}

function S(e, t) {
    const n = t.split("/");
    "" === n[n.length - 1] && n.pop();
    let r = e,
        i = null;
    for (const e of n) r[e] = r[e] || {}, i = r, r = r[e];
    return [i, n[n.length - 1]]
}
class A {
    constructor(e, t, n) {
        this._content = {}, this._processed = 0, this.file = e, this.client = t, this.worker = n
    }
    open() {
        return this._content = {}, this._processed = 0, new Promise(((e, t) => {
            this.client.open(this.file, w((() => {
                e(this)
            })))
        }))
    }
    async close() {
        var e;
        null === (e = this.worker) || void 0 === e || e.terminate(), this.worker = null, this.client = null, this.file = null
    }
    async hasEncryptedData() {
        return await this.client.hasEncryptedData()
    }
    async usePassword(e) {
        await this.client.usePassword(e)
    }
    async setLocale(e) {
        await this.client.setLocale(e)
    }
    async getFilesObject() {
        if (this._processed > 0) return Promise.resolve().then((() => this._content));
        return (await this.client.listFiles()).forEach((e => {
            const [t, n] = S(this._content, e.path);
            "FILE" === e.type && (t[n] = new R(e.fileName, e.size, e.path, e.lastModified, this))
        })), this._processed = 1, b(this._content)
    }
    getFilesArray() {
        return this.getFilesObject().then((e => P(e)))
    }
    async extractSingleFile(e) {
        if (null === this.worker) throw new Error("Archive already closed");
        const t = await this.client.extractSingleFile(e);
        return new File([t.fileData], t.fileName, {
            type: "application/octet-stream",
            lastModified: t.lastModified / 1e6
        })
    }
    async extractFiles(e = void 0) {
        var t;
        if (this._processed > 1) return Promise.resolve().then((() => this._content));
        return (await this.client.extractFiles()).forEach((t => {
            const [n, r] = S(this._content, t.path);
            "FILE" === t.type && (n[r] = new File([t.fileData], t.fileName, {
                type: "application/octet-stream"
            }), void 0 !== e && setTimeout(e.bind(null, {
                file: n[r],
                path: t.path
            })))
        })), this._processed = 2, null === (t = this.worker) || void 0 === t || t.terminate(), b(this._content)
    }
}
var _, k;
! function (e) {
    e.SEVEN_ZIP = "7zip", e.AR = "ar", e.ARBSD = "arbsd", e.ARGNU = "argnu", e.ARSVR4 = "arsvr4", e.BIN = "bin", e.BSDTAR = "bsdtar", e.CD9660 = "cd9660", e.CPIO = "cpio", e.GNUTAR = "gnutar", e.ISO = "iso", e.ISO9660 = "iso9660", e.MTREE = "mtree", e.MTREE_CLASSIC = "mtree-classic", e.NEWC = "newc", e.ODC = "odc", e.OLDTAR = "oldtar", e.PAX = "pax", e.PAXR = "paxr", e.POSIX = "posix", e.PWB = "pwb", e.RAW = "raw", e.RPAX = "rpax", e.SHAR = "shar", e.SHARDUMP = "shardump", e.USTAR = "ustar", e.V7TAR = "v7tar", e.V7 = "v7", e.WARC = "warc", e.XAR = "xar", e.ZIP = "zip"
}(_ || (_ = {})),
function (e) {
    e.B64ENCODE = "b64encode", e.BZIP2 = "bzip2", e.COMPRESS = "compress", e.GRZIP = "grzip", e.GZIP = "gzip", e.LRZIP = "lrzip", e.LZ4 = "lz4", e.LZIP = "lzip", e.LZMA = "lzma", e.LZOP = "lzop", e.UUENCODE = "uuencode", e.XZ = "xz", e.ZSTD = "zstd", e.NONE = "none"
}(k || (k = {}));
class O {
    static init(e = null) {
        return O._options = e || {}, O._options
    }
    static async open(e) {
        const t = await O.getWorker(O._options),
            n = await O.getClient(t, O._options),
            r = new A(e, n, t);
        return await r.open()
    }
    static async write({
        files: e,
        outputFileName: t,
        compression: n,
        format: r,
        passphrase: i = null
    }) {
        const s = await O.getWorker(O._options),
            a = await O.getClient(s, O._options),
            o = await a.writeArchive(e, n, r, i);
        return s.terminate(), new File([o], t, {
            type: "application/octet-stream"
        })
    }
    static async getWorker(e) {
        if (e.getWorker) {
            return e.getWorker();
        }

        const text = `const e=Symbol("Comlink.proxy"),r=Symbol("Comlink.endpoint"),t=Symbol("Comlink.releaseProxy"),n=Symbol("Comlink.finalizer"),o=Symbol("Comlink.thrown"),a=e=>"object"==typeof e&&null!==e||"function"==typeof e,s=new Map([["proxy",{canHandle:r=>a(r)&&r[e],serialize(e){const{port1:r,port2:t}=new MessageChannel;return i(e,r),[t,[t]]},deserialize(e){return e.start(),f(e,[],r);var r}}],["throw",{canHandle:e=>a(e)&&o in e,serialize({value:e}){let r;return r=e instanceof Error?{isError:!0,value:{message:e.message,name:e.name,stack:e.stack}}:{isError:!1,value:e},[r,[]]},deserialize(e){if(e.isError)throw Object.assign(new Error(e.value.message),e.value);throw e.value}}]]);function i(r,t=globalThis,a=["*"]){t.addEventListener("message",(function s(l){if(!l||!l.data)return;if(!function(e,r){for(const t of e){if(r===t||"*"===t)return!0;if(t instanceof RegExp&&t.test(r))return!0}return!1}(a,l.origin))return void console.warn(''Invalid origin '{{l.origin}' for comlink proxy'');const{id:c,type:d,path:h}=Object.assign({path:[]},l.data),f=(l.data.argumentList||[]).map(w);let m;try{const t=h.slice(0,-1).reduce(((e,r)=>e[r]),r),n=h.reduce(((e,r)=>e[r]),r);switch(d){case"GET":m=n;break;case"SET":t[h.slice(-1)[0]]=w(l.data.value),m=!0;break;case"APPLY":m=n.apply(t,f);break;case"CONSTRUCT":m=function(r){return Object.assign(r,{[e]:!0})}(new n(...f));break;case"ENDPOINT":{const{port1:e,port2:t}=new MessageChannel;i(r,t),m=function(e,r){return p.set(e,r),e}(e,[e])}break;case"RELEASE":m=void 0;break;default:return}}catch(e){m={value:e,[o]:0}}Promise.resolve(m).catch((e=>({value:e,[o]:0}))).then((e=>{const[o,a]=v(e);t.postMessage(Object.assign(Object.assign({},o),{id:c}),a),"RELEASE"===d&&(t.removeEventListener("message",s),u(t),n in r&&"function"==typeof r[n]&&r[n]())})).catch((e=>{const[r,n]=v({value:new TypeError("Unserializable return value"),[o]:0});t.postMessage(Object.assign(Object.assign({},r),{id:c}),n)}))})),t.start&&t.start()}function u(e){(function(e){return"MessagePort"===e.constructor.name})(e)&&e.close()}function l(e){if(e)throw new Error("Proxy has been released and is not useable")}function c(e){return g(e,{type:"RELEASE"}).then((()=>{u(e)}))}const d=new WeakMap,h="FinalizationRegistry"in globalThis&&new FinalizationRegistry((e=>{const r=(d.get(e)||0)-1;d.set(e,r),0===r&&c(e)}));function f(e,n=[],o=function(){}){let a=!1;const s=new Proxy(o,{get(r,o){if(l(a),o===t)return()=>{!function(e){h&&h.unregister(e)}(s),c(e),a=!0};if("then"===o){if(0===n.length)return{then:()=>s};const r=g(e,{type:"GET",path:n.map((e=>e.toString()))}).then(w);return r.then.bind(r)}return f(e,[...n,o])},set(r,t,o){l(a);const[s,i]=v(o);return g(e,{type:"SET",path:[...n,t].map((e=>e.toString())),value:s},i).then(w)},apply(t,o,s){l(a);const i=n[n.length-1];if(i===r)return g(e,{type:"ENDPOINT"}).then(w);if("bind"===i)return f(e,n.slice(0,-1));const[u,c]=m(s);return g(e,{type:"APPLY",path:n.map((e=>e.toString())),argumentList:u},c).then(w)},construct(r,t){l(a);const[o,s]=m(t);return g(e,{type:"CONSTRUCT",path:n.map((e=>e.toString())),argumentList:o},s).then(w)}});return function(e,r){const t=(d.get(r)||0)+1;d.set(r,t),h&&h.register(e,r,e)}(s,e),s}function m(e){const r=e.map(v);return[r.map((e=>e[0])),(t=r.map((e=>e[1])),Array.prototype.concat.apply([],t))];var t}const p=new WeakMap;function v(e){for(const[r,t]of s)if(t.canHandle(e)){const[n,o]=t.serialize(e);return[{type:"HANDLER",name:r,value:n},o]}return[{type:"RAW",value:e},p.get(e)||[]]}function w(e){switch(e.type){case"HANDLER":return s.get(e.name).deserialize(e.value);case"RAW":return e.value}}function g(e,r,t){return new Promise((n=>{const o=new Array(4).fill(0).map((()=>Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(16))).join("-");e.addEventListener("message",(function r(t){t.data&&t.data.id&&t.data.id===o&&(e.removeEventListener("message",r),n(t.data))})),e.start&&e.start(),e.postMessage(Object.assign({id:o},r),t)}))}const _={32768:"FILE",16384:"DIR",40960:"SYMBOLIC_LINK",49152:"SOCKET",8192:"CHARACTER_DEVICE",24576:"BLOCK_DEVICE",4096:"NAMED_PIPE"};class y{constructor(e){this._wasmModule=e,this._runCode=e.runCode,this._file=null,this._passphrase=null,this._locale="en_US.UTF-8"}async open(e){null!==this._file&&(console.warn("Closing previous file"),this.close());const r=await this._loadFile(e);this._fileLength=r.length,this._filePtr=r.ptr}close(){this._runCode.closeArchive(this._archive),this._wasmModule._free(this._filePtr),this._file=null,this._filePtr=null,this._archive=null}hasEncryptedData(){this._archive=this._runCode.openArchive(this._filePtr,this._fileLength,this._passphrase,this._locale),this._runCode.getNextEntry(this._archive);const e=this._runCode.hasEncryptedEntries(this._archive);return 0!==e&&(e>0||null)}setPassphrase(e){this._passphrase=e}setLocale(e){this._locale=e}*entries(e=!1,r=null){let t;for(this._archive=this._runCode.openArchive(this._filePtr,this._fileLength,this._passphrase,this._locale);t=this._runCode.getNextEntry(this._archive),0!==t;){const n={size:this._runCode.getEntrySize(t),path:this._runCode.getEntryName(t),type:_[this._runCode.getEntryType(t)],lastModified:this._runCode.getEntryLastModified(t),ref:t};if("FILE"===n.type){let e=n.path.split("/");n.fileName=e[e.length-1]}if(e&&r!==n.path)this._runCode.skipEntry(this._archive);else{const e=this._runCode.getFileData(this._archive,n.size);if(e<0)throw new Error(this._runCode.getError(this._archive));n.fileData=this._wasmModule.HEAPU8.slice(e,e+n.size),this._wasmModule._free(e)}yield n}}async _loadFile(e){const r=await e.arrayBuffer(),t=new Uint8Array(r),n=this._runCode.malloc(t.length);return this._wasmModule.HEAPU8.set(t,n),{ptr:n,length:t.length}}}class E{constructor(e){this._wasmModule=e,this._runCode=e.runCode,this._passphrase=null,this._locale="en_US.UTF-8"}async write(e,r,t,n=null){let o=e.reduce(((e,{file:r})=>e+r.size+128),0)+128;const a=this._runCode.malloc(o),s=this._runCode.malloc(this._runCode.sizeOfSizeT()),i=this._runCode.startArchiveWrite(r,t,a,o,s,n);for(const{file:r,pathname:t}of e){const e=await this._loadFile(r);this._runCode.writeArchiveFile(i,t||r.name,e.length,e.ptr),this._runCode.free(e.ptr)}const u=this._runCode.finishArchiveWrite(i,s);if(u<0)throw new Error(this._runCode.getError(i));return this._wasmModule.HEAPU8.slice(a,a+u)}async _loadFile(e){const r=await e.arrayBuffer(),t=new Uint8Array(r),n=this._runCode.malloc(t.length);return this._wasmModule.HEAPU8.set(t,n),{ptr:n,length:t.length}}}var b,k=(b=import.meta.url,async function(e={}){var r,t,n=e;n.ready=new Promise(((e,n)=>{r=e,t=n}));var o,a,s,i=Object.assign({},n),u="./this.program",l=(e,r)=>{throw r},c="object"==typeof window,d="function"==typeof importScripts,h="object"==typeof process&&"object"==typeof process.versions&&"string"==typeof process.versions.node,f="";if(h){const{createRequire:e}=await import("module");var m=e(import.meta.url),p=m("fs"),v=m("path");f=d?v.dirname(f)+"/":m("url").fileURLToPath(new URL("./",import.meta.url)),o=(e,r)=>(e=Y(e)?new URL(e):v.normalize(e),p.readFileSync(e,r?void 0:"utf8")),s=e=>{var r=o(e,!0);return r.buffer||(r=new Uint8Array(r)),r},a=(e,r,t,n=!0)=>{e=Y(e)?new URL(e):v.normalize(e),p.readFile(e,n?void 0:"utf8",((e,o)=>{e?t(e):r(n?o.buffer:o)}))},!n.thisProgram&&process.argv.length>1&&(u=process.argv[1].replace(/\\/g,"/")),process.argv.slice(2),l=(e,r)=>{throw process.exitCode=e,r},n.inspect=()=>"[Emscripten Module object]"}else(c||d)&&(d?f=self.location.href:"undefined"!=typeof document&&document.currentScript&&(f=document.currentScript.src),b&&(f=b),f=0!==f.indexOf("blob:")?f.substr(0,f.replace(/[?#].*/,"").lastIndexOf("/")+1):"",o=e=>{var r=new XMLHttpRequest;return r.open("GET",e,!1),r.send(null),r.responseText},d&&(s=e=>{var r=new XMLHttpRequest;return r.open("GET",e,!1),r.responseType="arraybuffer",r.send(null),new Uint8Array(r.response)}),a=(e,r,t)=>{var n=new XMLHttpRequest;n.open("GET",e,!0),n.responseType="arraybuffer",n.onload=()=>{200==n.status||0==n.status&&n.response?r(n.response):t()},n.onerror=t,n.send(null)});var w,g,_=n.print||console.log.bind(console),y=n.printErr||console.error.bind(console);Object.assign(n,i),i=null,n.arguments&&n.arguments,n.thisProgram&&(u=n.thisProgram),n.quit&&(l=n.quit),n.wasmBinary&&(w=n.wasmBinary),"object"!=typeof WebAssembly&&O("no native wasm support detected");var E,k,S,F,D,M=!1;function A(e,r){e||O(r)}function C(){var e=g.buffer;n.HEAP8=E=new Int8Array(e),n.HEAP16=S=new Int16Array(e),n.HEAPU8=k=new Uint8Array(e),n.HEAPU16=new Uint16Array(e),n.HEAP32=F=new Int32Array(e),n.HEAPU32=D=new Uint32Array(e),n.HEAPF32=new Float32Array(e),n.HEAPF64=new Float64Array(e)}var P=[],T=[],R=[],z=0,U=null;function L(e){z++,n.monitorRunDependencies?.(z)}function x(e){if(z--,n.monitorRunDependencies?.(z),0==z&&U){var r=U;U=null,r()}}function O(e){n.onAbort?.(e),y(e="Aborted("+e+")"),M=!0,e+=". Build with -sASSERTIONS for more info.";var r=new WebAssembly.RuntimeError(e);throw t(r),r}var N,B,j,I,H=e=>e.startsWith("data:application/octet-stream;base64,"),Y=e=>e.startsWith("file://");function W(e){if(e==N&&w)return new Uint8Array(w);if(s)return s(e);throw"both async and sync fetching of the wasm failed"}function K(e,r,t){return function(e){if(!w&&(c||d)){if("function"==typeof fetch&&!Y(e))return fetch(e,{credentials:"same-origin"}).then((r=>{if(!r.ok)throw"failed to load wasm binary file at '"+e+"'";return r.arrayBuffer()})).catch((()=>W(e)));if(a)return new Promise(((r,t)=>{a(e,(e=>r(new Uint8Array(e))),t)}))}return Promise.resolve().then((()=>W(e)))}(e).then((e=>WebAssembly.instantiate(e,r))).then((e=>e)).then(t,(e=>{y(''failed to asynchronously prepare wasm: {{e}''),O(e)}))}function q(e){this.name="ExitStatus",this.message=''Program terminated with exit({{e})'',this.status=e}n.locateFile?H(N="libarchive.wasm")||(B=N,N=n.locateFile?n.locateFile(B,f):f+B):N=new URL("libarchive.wasm",import.meta.url).href;var $=e=>{for(;e.length>0;)e.shift()(n)},X=n.noExitRuntime||!0,Z={isAbs:e=>"/"===e.charAt(0),splitPath:e=>/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(e).slice(1),normalizeArray:(e,r)=>{for(var t=0,n=e.length-1;n>=0;n--){var o=e[n];"."===o?e.splice(n,1):".."===o?(e.splice(n,1),t++):t&&(e.splice(n,1),t--)}if(r)for(;t;t--)e.unshift("..");return e},normalize:e=>{var r=Z.isAbs(e),t="/"===e.substr(-1);return(e=Z.normalizeArray(e.split("/").filter((e=>!!e)),!r).join("/"))||r||(e="."),e&&t&&(e+="/"),(r?"/":"")+e},dirname:e=>{var r=Z.splitPath(e),t=r[0],n=r[1];return t||n?(n&&(n=n.substr(0,n.length-1)),t+n):"."},basename:e=>{if("/"===e)return"/";var r=(e=(e=Z.normalize(e)).replace(/\/$/,"")).lastIndexOf("/");return-1===r?e:e.substr(r+1)},join:function(){var e=Array.prototype.slice.call(arguments);return Z.normalize(e.join("/"))},join2:(e,r)=>Z.normalize(e+"/"+r)},G=e=>(G=(()=>{if("object"==typeof crypto&&"function"==typeof crypto.getRandomValues)return e=>crypto.getRandomValues(e);if(h)try{var e=m("crypto");if(e.randomFillSync)return r=>e.randomFillSync(r);var r=e.randomBytes;return e=>(e.set(r(e.byteLength)),e)}catch(e){}O("initRandomDevice")})())(e),V={resolve:function(){for(var e="",r=!1,t=arguments.length-1;t>=-1&&!r;t--){var n=t>=0?arguments[t]:le.cwd();if("string"!=typeof n)throw new TypeError("Arguments to path.resolve must be strings");if(!n)return"";e=n+"/"+e,r=Z.isAbs(n)}return(r?"/":"")+(e=Z.normalizeArray(e.split("/").filter((e=>!!e)),!r).join("/"))||"."},relative:(e,r)=>{function t(e){for(var r=0;r<e.length&&""===e[r];r++);for(var t=e.length-1;t>=0&&""===e[t];t--);return r>t?[]:e.slice(r,t-r+1)}e=V.resolve(e).substr(1),r=V.resolve(r).substr(1);for(var n=t(e.split("/")),o=t(r.split("/")),a=Math.min(n.length,o.length),s=a,i=0;i<a;i++)if(n[i]!==o[i]){s=i;break}var u=[];for(i=s;i<n.length;i++)u.push("..");return(u=u.concat(o.slice(s))).join("/")}},J="undefined"!=typeof TextDecoder?new TextDecoder("utf8"):void 0,Q=(e,r,t)=>{for(var n=r+t,o=r;e[o]&&!(o>=n);)++o;if(o-r>16&&e.buffer&&J)return J.decode(e.subarray(r,o));for(var a="";r<o;){var s=e[r++];if(128&s){var i=63&e[r++];if(192!=(224&s)){var u=63&e[r++];if((s=224==(240&s)?(15&s)<<12|i<<6|u:(7&s)<<18|i<<12|u<<6|63&e[r++])<65536)a+=String.fromCharCode(s);else{var l=s-65536;a+=String.fromCharCode(55296|l>>10,56320|1023&l)}}else a+=String.fromCharCode((31&s)<<6|i)}else a+=String.fromCharCode(s)}return a},ee=[],re=e=>{for(var r=0,t=0;t<e.length;++t){var n=e.charCodeAt(t);n<=127?r++:n<=2047?r+=2:n>=55296&&n<=57343?(r+=4,++t):r+=3}return r},te=(e,r,t,n)=>{if(!(n>0))return 0;for(var o=t,a=t+n-1,s=0;s<e.length;++s){var i=e.charCodeAt(s);if(i>=55296&&i<=57343&&(i=65536+((1023&i)<<10)|1023&e.charCodeAt(++s)),i<=127){if(t>=a)break;r[t++]=i}else if(i<=2047){if(t+1>=a)break;r[t++]=192|i>>6,r[t++]=128|63&i}else if(i<=65535){if(t+2>=a)break;r[t++]=224|i>>12,r[t++]=128|i>>6&63,r[t++]=128|63&i}else{if(t+3>=a)break;r[t++]=240|i>>18,r[t++]=128|i>>12&63,r[t++]=128|i>>6&63,r[t++]=128|63&i}}return r[t]=0,t-o};function ne(e,r,t){var n=t>0?t:re(e)+1,o=new Array(n),a=te(e,o,0,o.length);return r&&(o.length=a),o}var oe={ttys:[],init(){},shutdown(){},register(e,r){oe.ttys[e]={input:[],output:[],ops:r},le.registerDevice(e,oe.stream_ops)},stream_ops:{open(e){var r=oe.ttys[e.node.rdev];if(!r)throw new le.ErrnoError(43);e.tty=r,e.seekable=!1},close(e){e.tty.ops.fsync(e.tty)},fsync(e){e.tty.ops.fsync(e.tty)},read(e,r,t,n,o){if(!e.tty||!e.tty.ops.get_char)throw new le.ErrnoError(60);for(var a=0,s=0;s<n;s++){var i;try{i=e.tty.ops.get_char(e.tty)}catch(e){throw new le.ErrnoError(29)}if(void 0===i&&0===a)throw new le.ErrnoError(6);if(null==i)break;a++,r[t+s]=i}return a&&(e.node.timestamp=Date.now()),a},write(e,r,t,n,o){if(!e.tty||!e.tty.ops.put_char)throw new le.ErrnoError(60);try{for(var a=0;a<n;a++)e.tty.ops.put_char(e.tty,r[t+a])}catch(e){throw new le.ErrnoError(29)}return n&&(e.node.timestamp=Date.now()),a}},default_tty_ops:{get_char:e=>(()=>{if(!ee.length){var e=null;if(h){var r=Buffer.alloc(256),t=0,n=process.stdin.fd;try{t=p.readSync(n,r)}catch(e){if(!e.toString().includes("EOF"))throw e;t=0}e=t>0?r.slice(0,t).toString("utf-8"):null}else"undefined"!=typeof window&&"function"==typeof window.prompt?null!==(e=window.prompt("Input: "))&&(e+="\n"):"function"==typeof readline&&null!==(e=readline())&&(e+="\n");if(!e)return null;ee=ne(e,!0)}return ee.shift()})(),put_char(e,r){null===r||10===r?(_(Q(e.output,0)),e.output=[]):0!=r&&e.output.push(r)},fsync(e){e.output&&e.output.length>0&&(_(Q(e.output,0)),e.output=[])},ioctl_tcgets:e=>({c_iflag:25856,c_oflag:5,c_cflag:191,c_lflag:35387,c_cc:[3,28,127,21,4,0,1,0,17,19,26,0,18,15,23,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}),ioctl_tcsets:(e,r,t)=>0,ioctl_tiocgwinsz:e=>[24,80]},default_tty1_ops:{put_char(e,r){null===r||10===r?(y(Q(e.output,0)),e.output=[]):0!=r&&e.output.push(r)},fsync(e){e.output&&e.output.length>0&&(y(Q(e.output,0)),e.output=[])}}},ae=e=>{O()},se={ops_table:null,mount:e=>se.createNode(null,"/",16895,0),createNode(e,r,t,n){if(le.isBlkdev(t)||le.isFIFO(t))throw new le.ErrnoError(63);se.ops_table||={dir:{node:{getattr:se.node_ops.getattr,setattr:se.node_ops.setattr,lookup:se.node_ops.lookup,mknod:se.node_ops.mknod,rename:se.node_ops.rename,unlink:se.node_ops.unlink,rmdir:se.node_ops.rmdir,readdir:se.node_ops.readdir,symlink:se.node_ops.symlink},stream:{llseek:se.stream_ops.llseek}},file:{node:{getattr:se.node_ops.getattr,setattr:se.node_ops.setattr},stream:{llseek:se.stream_ops.llseek,read:se.stream_ops.read,write:se.stream_ops.write,allocate:se.stream_ops.allocate,mmap:se.stream_ops.mmap,msync:se.stream_ops.msync}},link:{node:{getattr:se.node_ops.getattr,setattr:se.node_ops.setattr,readlink:se.node_ops.readlink},stream:{}},chrdev:{node:{getattr:se.node_ops.getattr,setattr:se.node_ops.setattr},stream:le.chrdev_stream_ops}};var o=le.createNode(e,r,t,n);return le.isDir(o.mode)?(o.node_ops=se.ops_table.dir.node,o.stream_ops=se.ops_table.dir.stream,o.contents={}):le.isFile(o.mode)?(o.node_ops=se.ops_table.file.node,o.stream_ops=se.ops_table.file.stream,o.usedBytes=0,o.contents=null):le.isLink(o.mode)?(o.node_ops=se.ops_table.link.node,o.stream_ops=se.ops_table.link.stream):le.isChrdev(o.mode)&&(o.node_ops=se.ops_table.chrdev.node,o.stream_ops=se.ops_table.chrdev.stream),o.timestamp=Date.now(),e&&(e.contents[r]=o,e.timestamp=o.timestamp),o},getFileDataAsTypedArray:e=>e.contents?e.contents.subarray?e.contents.subarray(0,e.usedBytes):new Uint8Array(e.contents):new Uint8Array(0),expandFileStorage(e,r){var t=e.contents?e.contents.length:0;if(!(t>=r)){r=Math.max(r,t*(t<1048576?2:1.125)>>>0),0!=t&&(r=Math.max(r,256));var n=e.contents;e.contents=new Uint8Array(r),e.usedBytes>0&&e.contents.set(n.subarray(0,e.usedBytes),0)}},resizeFileStorage(e,r){if(e.usedBytes!=r)if(0==r)e.contents=null,e.usedBytes=0;else{var t=e.contents;e.contents=new Uint8Array(r),t&&e.contents.set(t.subarray(0,Math.min(r,e.usedBytes))),e.usedBytes=r}},node_ops:{getattr(e){var r={};return r.dev=le.isChrdev(e.mode)?e.id:1,r.ino=e.id,r.mode=e.mode,r.nlink=1,r.uid=0,r.gid=0,r.rdev=e.rdev,le.isDir(e.mode)?r.size=4096:le.isFile(e.mode)?r.size=e.usedBytes:le.isLink(e.mode)?r.size=e.link.length:r.size=0,r.atime=new Date(e.timestamp),r.mtime=new Date(e.timestamp),r.ctime=new Date(e.timestamp),r.blksize=4096,r.blocks=Math.ceil(r.size/r.blksize),r},setattr(e,r){void 0!==r.mode&&(e.mode=r.mode),void 0!==r.timestamp&&(e.timestamp=r.timestamp),void 0!==r.size&&se.resizeFileStorage(e,r.size)},lookup(e,r){throw le.genericErrors[44]},mknod:(e,r,t,n)=>se.createNode(e,r,t,n),rename(e,r,t){if(le.isDir(e.mode)){var n;try{n=le.lookupNode(r,t)}catch(e){}if(n)for(var o in n.contents)throw new le.ErrnoError(55)}delete e.parent.contents[e.name],e.parent.timestamp=Date.now(),e.name=t,r.contents[t]=e,r.timestamp=e.parent.timestamp,e.parent=r},unlink(e,r){delete e.contents[r],e.timestamp=Date.now()},rmdir(e,r){var t=le.lookupNode(e,r);for(var n in t.contents)throw new le.ErrnoError(55);delete e.contents[r],e.timestamp=Date.now()},readdir(e){var r=[".",".."];for(var t of Object.keys(e.contents))r.push(t);return r},symlink(e,r,t){var n=se.createNode(e,r,41471,0);return n.link=t,n},readlink(e){if(!le.isLink(e.mode))throw new le.ErrnoError(28);return e.link}},stream_ops:{read(e,r,t,n,o){var a=e.node.contents;if(o>=e.node.usedBytes)return 0;var s=Math.min(e.node.usedBytes-o,n);if(s>8&&a.subarray)r.set(a.subarray(o,o+s),t);else for(var i=0;i<s;i++)r[t+i]=a[o+i];return s},write(e,r,t,n,o,a){if(r.buffer===E.buffer&&(a=!1),!n)return 0;var s=e.node;if(s.timestamp=Date.now(),r.subarray&&(!s.contents||s.contents.subarray)){if(a)return s.contents=r.subarray(t,t+n),s.usedBytes=n,n;if(0===s.usedBytes&&0===o)return s.contents=r.slice(t,t+n),s.usedBytes=n,n;if(o+n<=s.usedBytes)return s.contents.set(r.subarray(t,t+n),o),n}if(se.expandFileStorage(s,o+n),s.contents.subarray&&r.subarray)s.contents.set(r.subarray(t,t+n),o);else for(var i=0;i<n;i++)s.contents[o+i]=r[t+i];return s.usedBytes=Math.max(s.usedBytes,o+n),n},llseek(e,r,t){var n=r;if(1===t?n+=e.position:2===t&&le.isFile(e.node.mode)&&(n+=e.node.usedBytes),n<0)throw new le.ErrnoError(28);return n},allocate(e,r,t){se.expandFileStorage(e.node,r+t),e.node.usedBytes=Math.max(e.node.usedBytes,r+t)},mmap(e,r,t,n,o){if(!le.isFile(e.node.mode))throw new le.ErrnoError(43);var a,s,i=e.node.contents;if(2&o||i.buffer!==E.buffer){if((t>0||t+r<i.length)&&(i=i.subarray?i.subarray(t,t+r):Array.prototype.slice.call(i,t,t+r)),s=!0,!(a=ae()))throw new le.ErrnoError(48);E.set(i,a)}else s=!1,a=i.byteOffset;return{ptr:a,allocated:s}},msync:(e,r,t,n,o)=>(se.stream_ops.write(e,r,0,n,t,!1),0)}},ie=n.preloadPlugins||[],ue=(e,r)=>{var t=0;return e&&(t|=365),r&&(t|=146),t},le={root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:!1,ignorePermissions:!0,ErrnoError:null,genericErrors:{},filesystems:null,syncFSRequests:0,lookupPath(e,r={}){if(!(e=V.resolve(e)))return{path:"",node:null};if((r=Object.assign({follow_mount:!0,recurse_count:0},r)).recurse_count>8)throw new le.ErrnoError(32);for(var t=e.split("/").filter((e=>!!e)),n=le.root,o="/",a=0;a<t.length;a++){var s=a===t.length-1;if(s&&r.parent)break;if(n=le.lookupNode(n,t[a]),o=Z.join2(o,t[a]),le.isMountpoint(n)&&(!s||s&&r.follow_mount)&&(n=n.mounted.root),!s||r.follow)for(var i=0;le.isLink(n.mode);){var u=le.readlink(o);if(o=V.resolve(Z.dirname(o),u),n=le.lookupPath(o,{recurse_count:r.recurse_count+1}).node,i++>40)throw new le.ErrnoError(32)}}return{path:o,node:n}},getPath(e){for(var r;;){if(le.isRoot(e)){var t=e.mount.mountpoint;return r?"/"!==t[t.length-1]?''{{t}/{{r}'':t+r:t}r=r?''{{e.name}/{{r}'':e.name,e=e.parent}},hashName(e,r){for(var t=0,n=0;n<r.length;n++)t=(t<<5)-t+r.charCodeAt(n)|0;return(e+t>>>0)%le.nameTable.length},hashAddNode(e){var r=le.hashName(e.parent.id,e.name);e.name_next=le.nameTable[r],le.nameTable[r]=e},hashRemoveNode(e){var r=le.hashName(e.parent.id,e.name);if(le.nameTable[r]===e)le.nameTable[r]=e.name_next;else for(var t=le.nameTable[r];t;){if(t.name_next===e){t.name_next=e.name_next;break}t=t.name_next}},lookupNode(e,r){var t=le.mayLookup(e);if(t)throw new le.ErrnoError(t,e);for(var n=le.hashName(e.id,r),o=le.nameTable[n];o;o=o.name_next){var a=o.name;if(o.parent.id===e.id&&a===r)return o}return le.lookup(e,r)},createNode(e,r,t,n){var o=new le.FSNode(e,r,t,n);return le.hashAddNode(o),o},destroyNode(e){le.hashRemoveNode(e)},isRoot:e=>e===e.parent,isMountpoint:e=>!!e.mounted,isFile:e=>32768==(61440&e),isDir:e=>16384==(61440&e),isLink:e=>40960==(61440&e),isChrdev:e=>8192==(61440&e),isBlkdev:e=>24576==(61440&e),isFIFO:e=>4096==(61440&e),isSocket:e=>49152==(49152&e),flagsToPermissionString(e){var r=["r","w","rw"][3&e];return 512&e&&(r+="w"),r},nodePermissions:(e,r)=>le.ignorePermissions||(!r.includes("r")||292&e.mode)&&(!r.includes("w")||146&e.mode)&&(!r.includes("x")||73&e.mode)?0:2,mayLookup(e){var r=le.nodePermissions(e,"x");return r||(e.node_ops.lookup?0:2)},mayCreate(e,r){try{return le.lookupNode(e,r),20}catch(e){}return le.nodePermissions(e,"wx")},mayDelete(e,r,t){var n;try{n=le.lookupNode(e,r)}catch(e){return e.errno}var o=le.nodePermissions(e,"wx");if(o)return o;if(t){if(!le.isDir(n.mode))return 54;if(le.isRoot(n)||le.getPath(n)===le.cwd())return 10}else if(le.isDir(n.mode))return 31;return 0},mayOpen:(e,r)=>e?le.isLink(e.mode)?32:le.isDir(e.mode)&&("r"!==le.flagsToPermissionString(r)||512&r)?31:le.nodePermissions(e,le.flagsToPermissionString(r)):44,MAX_OPEN_FDS:4096,nextfd(){for(var e=0;e<=le.MAX_OPEN_FDS;e++)if(!le.streams[e])return e;throw new le.ErrnoError(33)},getStreamChecked(e){var r=le.getStream(e);if(!r)throw new le.ErrnoError(8);return r},getStream:e=>le.streams[e],createStream:(e,r=-1)=>(le.FSStream||(le.FSStream=function(){this.shared={}},le.FSStream.prototype={},Object.defineProperties(le.FSStream.prototype,{object:{get(){return this.node},set(e){this.node=e}},isRead:{get(){return 1!=(2097155&this.flags)}},isWrite:{get(){return 0!=(2097155&this.flags)}},isAppend:{get(){return 1024&this.flags}},flags:{get(){return this.shared.flags},set(e){this.shared.flags=e}},position:{get(){return this.shared.position},set(e){this.shared.position=e}}})),e=Object.assign(new le.FSStream,e),-1==r&&(r=le.nextfd()),e.fd=r,le.streams[r]=e,e),closeStream(e){le.streams[e]=null},chrdev_stream_ops:{open(e){var r=le.getDevice(e.node.rdev);e.stream_ops=r.stream_ops,e.stream_ops.open?.(e)},llseek(){throw new le.ErrnoError(70)}},major:e=>e>>8,minor:e=>255&e,makedev:(e,r)=>e<<8|r,registerDevice(e,r){le.devices[e]={stream_ops:r}},getDevice:e=>le.devices[e],getMounts(e){for(var r=[],t=[e];t.length;){var n=t.pop();r.push(n),t.push.apply(t,n.mounts)}return r},syncfs(e,r){"function"==typeof e&&(r=e,e=!1),le.syncFSRequests++,le.syncFSRequests>1&&y(''warning: {{le.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work'');var t=le.getMounts(le.root.mount),n=0;function o(e){return le.syncFSRequests--,r(e)}function a(e){if(e)return a.errored?void 0:(a.errored=!0,o(e));++n>=t.length&&o(null)}t.forEach((r=>{if(!r.type.syncfs)return a(null);r.type.syncfs(r,e,a)}))},mount(e,r,t){var n,o="/"===t,a=!t;if(o&&le.root)throw new le.ErrnoError(10);if(!o&&!a){var s=le.lookupPath(t,{follow_mount:!1});if(t=s.path,n=s.node,le.isMountpoint(n))throw new le.ErrnoError(10);if(!le.isDir(n.mode))throw new le.ErrnoError(54)}var i={type:e,opts:r,mountpoint:t,mounts:[]},u=e.mount(i);return u.mount=i,i.root=u,o?le.root=u:n&&(n.mounted=i,n.mount&&n.mount.mounts.push(i)),u},unmount(e){var r=le.lookupPath(e,{follow_mount:!1});if(!le.isMountpoint(r.node))throw new le.ErrnoError(28);var t=r.node,n=t.mounted,o=le.getMounts(n);Object.keys(le.nameTable).forEach((e=>{for(var r=le.nameTable[e];r;){var t=r.name_next;o.includes(r.mount)&&le.destroyNode(r),r=t}})),t.mounted=null;var a=t.mount.mounts.indexOf(n);t.mount.mounts.splice(a,1)},lookup:(e,r)=>e.node_ops.lookup(e,r),mknod(e,r,t){var n=le.lookupPath(e,{parent:!0}).node,o=Z.basename(e);if(!o||"."===o||".."===o)throw new le.ErrnoError(28);var a=le.mayCreate(n,o);if(a)throw new le.ErrnoError(a);if(!n.node_ops.mknod)throw new le.ErrnoError(63);return n.node_ops.mknod(n,o,r,t)},create:(e,r)=>(r=void 0!==r?r:438,r&=4095,r|=32768,le.mknod(e,r,0)),mkdir:(e,r)=>(r=void 0!==r?r:511,r&=1023,r|=16384,le.mknod(e,r,0)),mkdirTree(e,r){for(var t=e.split("/"),n="",o=0;o<t.length;++o)if(t[o]){n+="/"+t[o];try{le.mkdir(n,r)}catch(e){if(20!=e.errno)throw e}}},mkdev:(e,r,t)=>(void 0===t&&(t=r,r=438),r|=8192,le.mknod(e,r,t)),symlink(e,r){if(!V.resolve(e))throw new le.ErrnoError(44);var t=le.lookupPath(r,{parent:!0}).node;if(!t)throw new le.ErrnoError(44);var n=Z.basename(r),o=le.mayCreate(t,n);if(o)throw new le.ErrnoError(o);if(!t.node_ops.symlink)throw new le.ErrnoError(63);return t.node_ops.symlink(t,n,e)},rename(e,r){var t,n,o=Z.dirname(e),a=Z.dirname(r),s=Z.basename(e),i=Z.basename(r);if(t=le.lookupPath(e,{parent:!0}).node,n=le.lookupPath(r,{parent:!0}).node,!t||!n)throw new le.ErrnoError(44);if(t.mount!==n.mount)throw new le.ErrnoError(75);var u,l=le.lookupNode(t,s),c=V.relative(e,a);if("."!==c.charAt(0))throw new le.ErrnoError(28);if("."!==(c=V.relative(r,o)).charAt(0))throw new le.ErrnoError(55);try{u=le.lookupNode(n,i)}catch(e){}if(l!==u){var d=le.isDir(l.mode),h=le.mayDelete(t,s,d);if(h)throw new le.ErrnoError(h);if(h=u?le.mayDelete(n,i,d):le.mayCreate(n,i))throw new le.ErrnoError(h);if(!t.node_ops.rename)throw new le.ErrnoError(63);if(le.isMountpoint(l)||u&&le.isMountpoint(u))throw new le.ErrnoError(10);if(n!==t&&(h=le.nodePermissions(t,"w")))throw new le.ErrnoError(h);le.hashRemoveNode(l);try{t.node_ops.rename(l,n,i)}catch(e){throw e}finally{le.hashAddNode(l)}}},rmdir(e){var r=le.lookupPath(e,{parent:!0}).node,t=Z.basename(e),n=le.lookupNode(r,t),o=le.mayDelete(r,t,!0);if(o)throw new le.ErrnoError(o);if(!r.node_ops.rmdir)throw new le.ErrnoError(63);if(le.isMountpoint(n))throw new le.ErrnoError(10);r.node_ops.rmdir(r,t),le.destroyNode(n)},readdir(e){var r=le.lookupPath(e,{follow:!0}).node;if(!r.node_ops.readdir)throw new le.ErrnoError(54);return r.node_ops.readdir(r)},unlink(e){var r=le.lookupPath(e,{parent:!0}).node;if(!r)throw new le.ErrnoError(44);var t=Z.basename(e),n=le.lookupNode(r,t),o=le.mayDelete(r,t,!1);if(o)throw new le.ErrnoError(o);if(!r.node_ops.unlink)throw new le.ErrnoError(63);if(le.isMountpoint(n))throw new le.ErrnoError(10);r.node_ops.unlink(r,t),le.destroyNode(n)},readlink(e){var r=le.lookupPath(e).node;if(!r)throw new le.ErrnoError(44);if(!r.node_ops.readlink)throw new le.ErrnoError(28);return V.resolve(le.getPath(r.parent),r.node_ops.readlink(r))},stat(e,r){var t=le.lookupPath(e,{follow:!r}).node;if(!t)throw new le.ErrnoError(44);if(!t.node_ops.getattr)throw new le.ErrnoError(63);return t.node_ops.getattr(t)},lstat:e=>le.stat(e,!0),chmod(e,r,t){var n;if(!(n="string"==typeof e?le.lookupPath(e,{follow:!t}).node:e).node_ops.setattr)throw new le.ErrnoError(63);n.node_ops.setattr(n,{mode:4095&r|-4096&n.mode,timestamp:Date.now()})},lchmod(e,r){le.chmod(e,r,!0)},fchmod(e,r){var t=le.getStreamChecked(e);le.chmod(t.node,r)},chown(e,r,t,n){var o;if(!(o="string"==typeof e?le.lookupPath(e,{follow:!n}).node:e).node_ops.setattr)throw new le.ErrnoError(63);o.node_ops.setattr(o,{timestamp:Date.now()})},lchown(e,r,t){le.chown(e,r,t,!0)},fchown(e,r,t){var n=le.getStreamChecked(e);le.chown(n.node,r,t)},truncate(e,r){if(r<0)throw new le.ErrnoError(28);var t;if(!(t="string"==typeof e?le.lookupPath(e,{follow:!0}).node:e).node_ops.setattr)throw new le.ErrnoError(63);if(le.isDir(t.mode))throw new le.ErrnoError(31);if(!le.isFile(t.mode))throw new le.ErrnoError(28);var n=le.nodePermissions(t,"w");if(n)throw new le.ErrnoError(n);t.node_ops.setattr(t,{size:r,timestamp:Date.now()})},ftruncate(e,r){var t=le.getStreamChecked(e);if(0==(2097155&t.flags))throw new le.ErrnoError(28);le.truncate(t.node,r)},utime(e,r,t){var n=le.lookupPath(e,{follow:!0}).node;n.node_ops.setattr(n,{timestamp:Math.max(r,t)})},open(e,r,t){if(""===e)throw new le.ErrnoError(44);var o;if(t=void 0===t?438:t,t=64&(r="string"==typeof r?(e=>{var r={r:0,"r+":2,w:577,"w+":578,a:1089,"a+":1090}[e];if(void 0===r)throw new Error(''Unknown file open mode: {{e}'');return r})(r):r)?4095&t|32768:0,"object"==typeof e)o=e;else{e=Z.normalize(e);try{o=le.lookupPath(e,{follow:!(131072&r)}).node}catch(e){}}var a=!1;if(64&r)if(o){if(128&r)throw new le.ErrnoError(20)}else o=le.mknod(e,t,0),a=!0;if(!o)throw new le.ErrnoError(44);if(le.isChrdev(o.mode)&&(r&=-513),65536&r&&!le.isDir(o.mode))throw new le.ErrnoError(54);if(!a){var s=le.mayOpen(o,r);if(s)throw new le.ErrnoError(s)}512&r&&!a&&le.truncate(o,0),r&=-131713;var i=le.createStream({node:o,path:le.getPath(o),flags:r,seekable:!0,position:0,stream_ops:o.stream_ops,ungotten:[],error:!1});return i.stream_ops.open&&i.stream_ops.open(i),!n.logReadFiles||1&r||(le.readFiles||(le.readFiles={}),e in le.readFiles||(le.readFiles[e]=1)),i},close(e){if(le.isClosed(e))throw new le.ErrnoError(8);e.getdents&&(e.getdents=null);try{e.stream_ops.close&&e.stream_ops.close(e)}catch(e){throw e}finally{le.closeStream(e.fd)}e.fd=null},isClosed:e=>null===e.fd,llseek(e,r,t){if(le.isClosed(e))throw new le.ErrnoError(8);if(!e.seekable||!e.stream_ops.llseek)throw new le.ErrnoError(70);if(0!=t&&1!=t&&2!=t)throw new le.ErrnoError(28);return e.position=e.stream_ops.llseek(e,r,t),e.ungotten=[],e.position},read(e,r,t,n,o){if(n<0||o<0)throw new le.ErrnoError(28);if(le.isClosed(e))throw new le.ErrnoError(8);if(1==(2097155&e.flags))throw new le.ErrnoError(8);if(le.isDir(e.node.mode))throw new le.ErrnoError(31);if(!e.stream_ops.read)throw new le.ErrnoError(28);var a=void 0!==o;if(a){if(!e.seekable)throw new le.ErrnoError(70)}else o=e.position;var s=e.stream_ops.read(e,r,t,n,o);return a||(e.position+=s),s},write(e,r,t,n,o,a){if(n<0||o<0)throw new le.ErrnoError(28);if(le.isClosed(e))throw new le.ErrnoError(8);if(0==(2097155&e.flags))throw new le.ErrnoError(8);if(le.isDir(e.node.mode))throw new le.ErrnoError(31);if(!e.stream_ops.write)throw new le.ErrnoError(28);e.seekable&&1024&e.flags&&le.llseek(e,0,2);var s=void 0!==o;if(s){if(!e.seekable)throw new le.ErrnoError(70)}else o=e.position;var i=e.stream_ops.write(e,r,t,n,o,a);return s||(e.position+=i),i},allocate(e,r,t){if(le.isClosed(e))throw new le.ErrnoError(8);if(r<0||t<=0)throw new le.ErrnoError(28);if(0==(2097155&e.flags))throw new le.ErrnoError(8);if(!le.isFile(e.node.mode)&&!le.isDir(e.node.mode))throw new le.ErrnoError(43);if(!e.stream_ops.allocate)throw new le.ErrnoError(138);e.stream_ops.allocate(e,r,t)},mmap(e,r,t,n,o){if(0!=(2&n)&&0==(2&o)&&2!=(2097155&e.flags))throw new le.ErrnoError(2);if(1==(2097155&e.flags))throw new le.ErrnoError(2);if(!e.stream_ops.mmap)throw new le.ErrnoError(43);return e.stream_ops.mmap(e,r,t,n,o)},msync:(e,r,t,n,o)=>e.stream_ops.msync?e.stream_ops.msync(e,r,t,n,o):0,munmap:e=>0,ioctl(e,r,t){if(!e.stream_ops.ioctl)throw new le.ErrnoError(59);return e.stream_ops.ioctl(e,r,t)},readFile(e,r={}){if(r.flags=r.flags||0,r.encoding=r.encoding||"binary","utf8"!==r.encoding&&"binary"!==r.encoding)throw new Error(''Invalid encoding type "{{r.encoding}"'');var t,n=le.open(e,r.flags),o=le.stat(e).size,a=new Uint8Array(o);return le.read(n,a,0,o,0),"utf8"===r.encoding?t=Q(a,0):"binary"===r.encoding&&(t=a),le.close(n),t},writeFile(e,r,t={}){t.flags=t.flags||577;var n=le.open(e,t.flags,t.mode);if("string"==typeof r){var o=new Uint8Array(re(r)+1),a=te(r,o,0,o.length);le.write(n,o,0,a,void 0,t.canOwn)}else{if(!ArrayBuffer.isView(r))throw new Error("Unsupported data type");le.write(n,r,0,r.byteLength,void 0,t.canOwn)}le.close(n)},cwd:()=>le.currentPath,chdir(e){var r=le.lookupPath(e,{follow:!0});if(null===r.node)throw new le.ErrnoError(44);if(!le.isDir(r.node.mode))throw new le.ErrnoError(54);var t=le.nodePermissions(r.node,"x");if(t)throw new le.ErrnoError(t);le.currentPath=r.path},createDefaultDirectories(){le.mkdir("/tmp"),le.mkdir("/home"),le.mkdir("/home/web_user")},createDefaultDevices(){le.mkdir("/dev"),le.registerDevice(le.makedev(1,3),{read:()=>0,write:(e,r,t,n,o)=>n}),le.mkdev("/dev/null",le.makedev(1,3)),oe.register(le.makedev(5,0),oe.default_tty_ops),oe.register(le.makedev(6,0),oe.default_tty1_ops),le.mkdev("/dev/tty",le.makedev(5,0)),le.mkdev("/dev/tty1",le.makedev(6,0));var e=new Uint8Array(1024),r=0,t=()=>(0===r&&(r=G(e).byteLength),e[--r]);le.createDevice("/dev","random",t),le.createDevice("/dev","urandom",t),le.mkdir("/dev/shm"),le.mkdir("/dev/shm/tmp")},createSpecialDirectories(){le.mkdir("/proc");var e=le.mkdir("/proc/self");le.mkdir("/proc/self/fd"),le.mount({mount(){var r=le.createNode(e,"fd",16895,73);return r.node_ops={lookup(e,r){var t=+r,n=le.getStreamChecked(t),o={parent:null,mount:{mountpoint:"fake"},node_ops:{readlink:()=>n.path}};return o.parent=o,o}},r}},{},"/proc/self/fd")},createStandardStreams(){n.stdin?le.createDevice("/dev","stdin",n.stdin):le.symlink("/dev/tty","/dev/stdin"),n.stdout?le.createDevice("/dev","stdout",null,n.stdout):le.symlink("/dev/tty","/dev/stdout"),n.stderr?le.createDevice("/dev","stderr",null,n.stderr):le.symlink("/dev/tty1","/dev/stderr"),le.open("/dev/stdin",0),le.open("/dev/stdout",1),le.open("/dev/stderr",1)},ensureErrnoError(){le.ErrnoError||(le.ErrnoError=function(e,r){this.name="ErrnoError",this.node=r,this.setErrno=function(e){this.errno=e},this.setErrno(e),this.message="FS error"},le.ErrnoError.prototype=new Error,le.ErrnoError.prototype.constructor=le.ErrnoError,[44].forEach((e=>{le.genericErrors[e]=new le.ErrnoError(e),le.genericErrors[e].stack="<generic error, no stack>"})))},staticInit(){le.ensureErrnoError(),le.nameTable=new Array(4096),le.mount(se,{},"/"),le.createDefaultDirectories(),le.createDefaultDevices(),le.createSpecialDirectories(),le.filesystems={MEMFS:se}},init(e,r,t){le.init.initialized=!0,le.ensureErrnoError(),n.stdin=e||n.stdin,n.stdout=r||n.stdout,n.stderr=t||n.stderr,le.createStandardStreams()},quit(){le.init.initialized=!1;for(var e=0;e<le.streams.length;e++){var r=le.streams[e];r&&le.close(r)}},findObject(e,r){var t=le.analyzePath(e,r);return t.exists?t.object:null},analyzePath(e,r){try{e=(n=le.lookupPath(e,{follow:!r})).path}catch(e){}var t={isRoot:!1,exists:!1,error:0,name:null,path:null,object:null,parentExists:!1,parentPath:null,parentObject:null};try{var n=le.lookupPath(e,{parent:!0});t.parentExists=!0,t.parentPath=n.path,t.parentObject=n.node,t.name=Z.basename(e),n=le.lookupPath(e,{follow:!r}),t.exists=!0,t.path=n.path,t.object=n.node,t.name=n.node.name,t.isRoot="/"===n.path}catch(e){t.error=e.errno}return t},createPath(e,r,t,n){e="string"==typeof e?e:le.getPath(e);for(var o=r.split("/").reverse();o.length;){var a=o.pop();if(a){var s=Z.join2(e,a);try{le.mkdir(s)}catch(e){}e=s}}return s},createFile(e,r,t,n,o){var a=Z.join2("string"==typeof e?e:le.getPath(e),r),s=ue(n,o);return le.create(a,s)},createDataFile(e,r,t,n,o,a){var s=r;e&&(e="string"==typeof e?e:le.getPath(e),s=r?Z.join2(e,r):e);var i=ue(n,o),u=le.create(s,i);if(t){if("string"==typeof t){for(var l=new Array(t.length),c=0,d=t.length;c<d;++c)l[c]=t.charCodeAt(c);t=l}le.chmod(u,146|i);var h=le.open(u,577);le.write(h,t,0,t.length,0,a),le.close(h),le.chmod(u,i)}},createDevice(e,r,t,n){var o=Z.join2("string"==typeof e?e:le.getPath(e),r),a=ue(!!t,!!n);le.createDevice.major||(le.createDevice.major=64);var s=le.makedev(le.createDevice.major++,0);return le.registerDevice(s,{open(e){e.seekable=!1},close(e){n?.buffer?.length&&n(10)},read(e,r,n,o,a){for(var s=0,i=0;i<o;i++){var u;try{u=t()}catch(e){throw new le.ErrnoError(29)}if(void 0===u&&0===s)throw new le.ErrnoError(6);if(null==u)break;s++,r[n+i]=u}return s&&(e.node.timestamp=Date.now()),s},write(e,r,t,o,a){for(var s=0;s<o;s++)try{n(r[t+s])}catch(e){throw new le.ErrnoError(29)}return o&&(e.node.timestamp=Date.now()),s}}),le.mkdev(o,a,s)},forceLoadFile(e){if(e.isDevice||e.isFolder||e.link||e.contents)return!0;if("undefined"!=typeof XMLHttpRequest)throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");if(!o)throw new Error("Cannot load without read() or XMLHttpRequest.");try{e.contents=ne(o(e.url),!0),e.usedBytes=e.contents.length}catch(e){throw new le.ErrnoError(29)}},createLazyFile(e,r,t,n,o){function a(){this.lengthKnown=!1,this.chunks=[]}if(a.prototype.get=function(e){if(!(e>this.length-1||e<0)){var r=e%this.chunkSize,t=e/this.chunkSize|0;return this.getter(t)[r]}},a.prototype.setDataGetter=function(e){this.getter=e},a.prototype.cacheLength=function(){var e=new XMLHttpRequest;if(e.open("HEAD",t,!1),e.send(null),!(e.status>=200&&e.status<300||304===e.status))throw new Error("Couldn't load "+t+". Status: "+e.status);var r,n=Number(e.getResponseHeader("Content-length")),o=(r=e.getResponseHeader("Accept-Ranges"))&&"bytes"===r,a=(r=e.getResponseHeader("Content-Encoding"))&&"gzip"===r,s=1048576;o||(s=n);var i=this;i.setDataGetter((e=>{var r=e*s,o=(e+1)*s-1;if(o=Math.min(o,n-1),void 0===i.chunks[e]&&(i.chunks[e]=((e,r)=>{if(e>r)throw new Error("invalid range ("+e+", "+r+") or no bytes requested!");if(r>n-1)throw new Error("only "+n+" bytes available! programmer error!");var o=new XMLHttpRequest;if(o.open("GET",t,!1),n!==s&&o.setRequestHeader("Range","bytes="+e+"-"+r),o.responseType="arraybuffer",o.overrideMimeType&&o.overrideMimeType("text/plain; charset=x-user-defined"),o.send(null),!(o.status>=200&&o.status<300||304===o.status))throw new Error("Couldn't load "+t+". Status: "+o.status);return void 0!==o.response?new Uint8Array(o.response||[]):ne(o.responseText||"",!0)})(r,o)),void 0===i.chunks[e])throw new Error("doXHR failed!");return i.chunks[e]})),!a&&n||(s=n=1,n=this.getter(0).length,s=n,_("LazyFiles on gzip forces download of the whole file when length is accessed")),this._length=n,this._chunkSize=s,this.lengthKnown=!0},"undefined"!=typeof XMLHttpRequest){if(!d)throw"Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";var s=new a;Object.defineProperties(s,{length:{get:function(){return this.lengthKnown||this.cacheLength(),this._length}},chunkSize:{get:function(){return this.lengthKnown||this.cacheLength(),this._chunkSize}}});var i={isDevice:!1,contents:s}}else i={isDevice:!1,url:t};var u=le.createFile(e,r,i,n,o);i.contents?u.contents=i.contents:i.url&&(u.contents=null,u.url=i.url),Object.defineProperties(u,{usedBytes:{get:function(){return this.contents.length}}});var l={};function c(e,r,t,n,o){var a=e.node.contents;if(o>=a.length)return 0;var s=Math.min(a.length-o,n);if(a.slice)for(var i=0;i<s;i++)r[t+i]=a[o+i];else for(i=0;i<s;i++)r[t+i]=a.get(o+i);return s}return Object.keys(u.stream_ops).forEach((e=>{var r=u.stream_ops[e];l[e]=function(){return le.forceLoadFile(u),r.apply(null,arguments)}})),l.read=(e,r,t,n,o)=>(le.forceLoadFile(u),c(e,r,t,n,o)),l.mmap=(e,r,t,n,o)=>{le.forceLoadFile(u);var a=ae();if(!a)throw new le.ErrnoError(48);return c(e,E,a,r,t),{ptr:a,allocated:!0}},u.stream_ops=l,u}},ce=(e,r)=>e?Q(k,e,r):"",de={DEFAULT_POLLMASK:5,calculateAt(e,r,t){if(Z.isAbs(r))return r;var n;if(n=-100===e?le.cwd():de.getStreamFromFD(e).path,0==r.length){if(!t)throw new le.ErrnoError(44);return n}return Z.join2(n,r)},doStat(e,r,t){try{var n=e(r)}catch(e){if(e&&e.node&&Z.normalize(r)!==Z.normalize(le.getPath(e.node)))return-54;throw e}F[t>>2]=n.dev,F[t+4>>2]=n.mode,D[t+8>>2]=n.nlink,F[t+12>>2]=n.uid,F[t+16>>2]=n.gid,F[t+20>>2]=n.rdev,I=[n.size>>>0,(j=n.size,+Math.abs(j)>=1?j>0?+Math.floor(j/4294967296)>>>0:~~+Math.ceil((j-+(~~j>>>0))/4294967296)>>>0:0)],F[t+24>>2]=I[0],F[t+28>>2]=I[1],F[t+32>>2]=4096,F[t+36>>2]=n.blocks;var o=n.atime.getTime(),a=n.mtime.getTime(),s=n.ctime.getTime();return I=[Math.floor(o/1e3)>>>0,(j=Math.floor(o/1e3),+Math.abs(j)>=1?j>0?+Math.floor(j/4294967296)>>>0:~~+Math.ceil((j-+(~~j>>>0))/4294967296)>>>0:0)],F[t+40>>2]=I[0],F[t+44>>2]=I[1],D[t+48>>2]=o%1e3*1e3,I=[Math.floor(a/1e3)>>>0,(j=Math.floor(a/1e3),+Math.abs(j)>=1?j>0?+Math.floor(j/4294967296)>>>0:~~+Math.ceil((j-+(~~j>>>0))/4294967296)>>>0:0)],F[t+56>>2]=I[0],F[t+60>>2]=I[1],D[t+64>>2]=a%1e3*1e3,I=[Math.floor(s/1e3)>>>0,(j=Math.floor(s/1e3),+Math.abs(j)>=1?j>0?+Math.floor(j/4294967296)>>>0:~~+Math.ceil((j-+(~~j>>>0))/4294967296)>>>0:0)],F[t+72>>2]=I[0],F[t+76>>2]=I[1],D[t+80>>2]=s%1e3*1e3,I=[n.ino>>>0,(j=n.ino,+Math.abs(j)>=1?j>0?+Math.floor(j/4294967296)>>>0:~~+Math.ceil((j-+(~~j>>>0))/4294967296)>>>0:0)],F[t+88>>2]=I[0],F[t+92>>2]=I[1],0},doMsync(e,r,t,n,o){if(!le.isFile(r.node.mode))throw new le.ErrnoError(43);if(2&n)return 0;var a=k.slice(e,e+t);le.msync(r,a,o,t,n)},varargs:void 0,get(){var e=F[+de.varargs>>2];return de.varargs+=4,e},getp:()=>de.get(),getStr:e=>ce(e),getStreamFromFD:e=>le.getStreamChecked(e)},he=e=>(F[Oe()>>2]=e,e),fe={BUCKET_BUFFER_SIZE:8192,mount:e=>le.createNode(null,"/",16895,0),createPipe(){var e={buckets:[],refcnt:2};e.buckets.push({buffer:new Uint8Array(fe.BUCKET_BUFFER_SIZE),offset:0,roffset:0});var r=fe.nextname(),t=fe.nextname(),n=le.createNode(fe.root,r,4096,0),o=le.createNode(fe.root,t,4096,0);n.pipe=e,o.pipe=e;var a=le.createStream({path:r,node:n,flags:0,seekable:!1,stream_ops:fe.stream_ops});n.stream=a;var s=le.createStream({path:t,node:o,flags:1,seekable:!1,stream_ops:fe.stream_ops});return o.stream=s,{readable_fd:a.fd,writable_fd:s.fd}},stream_ops:{poll(e){var r=e.node.pipe;if(1==(2097155&e.flags))return 260;if(r.buckets.length>0)for(var t=0;t<r.buckets.length;t++){var n=r.buckets[t];if(n.offset-n.roffset>0)return 65}return 0},ioctl:(e,r,t)=>28,fsync:e=>28,read(e,r,t,n,o){for(var a=e.node.pipe,s=0,i=0;i<a.buckets.length;i++){var u=a.buckets[i];s+=u.offset-u.roffset}var l=r.subarray(t,t+n);if(n<=0)return 0;if(0==s)throw new le.ErrnoError(6);var c=Math.min(s,n),d=c,h=0;for(i=0;i<a.buckets.length;i++){var f=a.buckets[i],m=f.offset-f.roffset;if(c<=m){var p=f.buffer.subarray(f.roffset,f.offset);c<m?(p=p.subarray(0,c),f.roffset+=c):h++,l.set(p);break}p=f.buffer.subarray(f.roffset,f.offset),l.set(p),l=l.subarray(p.byteLength),c-=p.byteLength,h++}return h&&h==a.buckets.length&&(h--,a.buckets[h].offset=0,a.buckets[h].roffset=0),a.buckets.splice(0,h),d},write(e,r,t,n,o){var a=e.node.pipe,s=r.subarray(t,t+n),i=s.byteLength;if(i<=0)return 0;var u=null;0==a.buckets.length?(u={buffer:new Uint8Array(fe.BUCKET_BUFFER_SIZE),offset:0,roffset:0},a.buckets.push(u)):u=a.buckets[a.buckets.length-1],A(u.offset<=fe.BUCKET_BUFFER_SIZE);var l=fe.BUCKET_BUFFER_SIZE-u.offset;if(l>=i)return u.buffer.set(s,u.offset),u.offset+=i,i;l>0&&(u.buffer.set(s.subarray(0,l),u.offset),u.offset+=l,s=s.subarray(l,s.byteLength));for(var c=s.byteLength/fe.BUCKET_BUFFER_SIZE|0,d=s.byteLength%fe.BUCKET_BUFFER_SIZE,h=0;h<c;h++){var f={buffer:new Uint8Array(fe.BUCKET_BUFFER_SIZE),offset:fe.BUCKET_BUFFER_SIZE,roffset:0};a.buckets.push(f),f.buffer.set(s.subarray(0,fe.BUCKET_BUFFER_SIZE)),s=s.subarray(fe.BUCKET_BUFFER_SIZE,s.byteLength)}return d>0&&(f={buffer:new Uint8Array(fe.BUCKET_BUFFER_SIZE),offset:s.byteLength,roffset:0},a.buckets.push(f),f.buffer.set(s)),i},close(e){var r=e.node.pipe;r.refcnt--,0===r.refcnt&&(r.buckets=null)}},nextname:()=>(fe.nextname.current||(fe.nextname.current=0),"pipe["+fe.nextname.current+++"]")},me=(e,r)=>r+2097152>>>0<4194305-!!e?(e>>>0)+4294967296*r:NaN,pe=e=>e%4==0&&(e%100!=0||e%400==0),ve=[0,31,60,91,121,152,182,213,244,274,305,335],we=[0,31,59,90,120,151,181,212,243,273,304,334],ge=e=>(pe(e.getFullYear())?ve:we)[e.getMonth()]+e.getDate()-1,_e=(e,r,t)=>te(e,k,r,t),ye=e=>{var r=re(e)+1,t=xe(r);return t&&_e(e,t,r),t},Ee=e=>{var r=(e-g.buffer.byteLength+65535)/65536;try{return g.grow(r),C(),1}catch(e){}},be={},ke=()=>{if(!ke.strings){var e={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:("object"==typeof navigator&&navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8",_:u||"./this.program"};for(var r in be)void 0===be[r]?delete e[r]:e[r]=be[r];var t=[];for(var r in e)t.push(''{{r}={{e[r]}'');ke.strings=t}return ke.strings},Se=e=>{X||(n.onExit?.(e),M=!0),l(e,new q(e))},Fe=(e,r)=>{Se(e)},De=[31,29,31,30,31,30,31,31,30,31,30,31],Me=[31,28,31,30,31,30,31,31,30,31,30,31],Ae=(e,r)=>{E.set(e,r)},Ce=e=>n["_"+e],Pe=(e,r,t,n,o)=>{var a={string:e=>{var r=0;return null!=e&&0!==e&&(r=(e=>{var r=re(e)+1,t=He(r);return _e(e,t,r),t})(e)),r},array:e=>{var r=He(e.length);return Ae(e,r),r}},s=Ce(e),i=[],u=0;if(n)for(var l=0;l<n.length;l++){var c=a[t[l]];c?(0===u&&(u=je()),i[l]=c(n[l])):i[l]=n[l]}var d=s.apply(null,i);return d=function(e){return 0!==u&&Ie(u),function(e){return"string"===r?ce(e):"boolean"===r?Boolean(e):e}(e)}(d)},Te=function(e,r,t,n){e||(e=this),this.parent=e,this.mount=e.mount,this.mounted=null,this.id=le.nextInode++,this.name=r,this.mode=t,this.node_ops={},this.stream_ops={},this.rdev=n},Re=365,ze=146;Object.defineProperties(Te.prototype,{read:{get:function(){return(this.mode&Re)===Re},set:function(e){e?this.mode|=Re:this.mode&=-366}},write:{get:function(){return(this.mode&ze)===ze},set:function(e){e?this.mode|=ze:this.mode&=-147}},isFolder:{get:function(){return le.isDir(this.mode)}},isDevice:{get:function(){return le.isChrdev(this.mode)}}}),le.FSNode=Te,le.createPreloadedFile=(e,r,t,n,o,s,i,u,l,c)=>{var d=r?V.resolve(Z.join2(e,r)):e;function h(t){function a(t){c?.(),u||((e,r,t,n,o,a)=>{le.createDataFile(e,r,t,n,o,a)})(e,r,t,n,o,l),s?.(),x()}((e,r,t,n)=>{"undefined"!=typeof Browser&&Browser.init();var o=!1;return ie.forEach((a=>{o||a.canHandle(r)&&(a.handle(e,r,t,n),o=!0)})),o})(t,d,a,(()=>{i?.(),x()}))||a(t)}L(),"string"==typeof t?((e,r,t,n)=>{var o=n?"":''al {{e}'';a(e,(t=>{A(t,''Loading data file "{{e}" failed (no arrayBuffer).''),r(new Uint8Array(t)),o&&x()}),(r=>{if(!t)throw''Loading data file "{{e}" failed.'';t()})),o&&L()})(t,(e=>h(e)),i):h(t)},le.staticInit();var Ue={i:function(e){try{var r=de.getStreamFromFD(e);return le.createStream(r).fd}catch(e){if(void 0===le||"ErrnoError"!==e.name)throw e;return-e.errno}},a:function(e,r,t){de.varargs=t;try{var n=de.getStreamFromFD(e);switch(r){case 0:if((o=de.get())<0)return-28;for(;le.streams[o];)o++;return le.createStream(n,o).fd;case 1:case 2:case 6:case 7:return 0;case 3:return n.flags;case 4:var o=de.get();return n.flags|=o,0;case 5:return o=de.getp(),S[o+0>>1]=2,0;case 16:case 8:default:return-28;case 9:return he(28),-1}}catch(e){if(void 0===le||"ErrnoError"!==e.name)throw e;return-e.errno}},x:function(e,r){try{var t=de.getStreamFromFD(e);return de.doStat(le.stat,t.path,r)}catch(e){if(void 0===le||"ErrnoError"!==e.name)throw e;return-e.errno}},u:function(e,r){try{return e=de.getStr(e),de.doStat(le.lstat,e,r)}catch(e){if(void 0===le||"ErrnoError"!==e.name)throw e;return-e.errno}},v:function(e,r,t,n){try{r=de.getStr(r);var o=256&n,a=4096&n;return n&=-6401,r=de.calculateAt(e,r,a),de.doStat(o?le.lstat:le.stat,r,t)}catch(e){if(void 0===le||"ErrnoError"!==e.name)throw e;return-e.errno}},y:function(e,r,t,n){de.varargs=n;try{r=de.getStr(r),r=de.calculateAt(e,r);var o=n?de.get():0;return le.open(r,t,o).fd}catch(e){if(void 0===le||"ErrnoError"!==e.name)throw e;return-e.errno}},t:function(e){try{if(0==e)throw new le.ErrnoError(21);var r=fe.createPipe();return F[e>>2]=r.readable_fd,F[e+4>>2]=r.writable_fd,0}catch(e){if(void 0===le||"ErrnoError"!==e.name)throw e;return-e.errno}},s:function(e,r,t){try{for(var n=0,o=0;o<r;o++){var a=e+8*o,s=F[a>>2],i=S[a+4>>1],u=32,l=le.getStream(s);l&&(u=de.DEFAULT_POLLMASK,l.stream_ops.poll&&(u=l.stream_ops.poll(l,-1))),(u&=24|i)&&n++,S[a+6>>1]=u}return n}catch(e){if(void 0===le||"ErrnoError"!==e.name)throw e;return-e.errno}},w:function(e,r){try{return e=de.getStr(e),de.doStat(le.stat,e,r)}catch(e){if(void 0===le||"ErrnoError"!==e.name)throw e;return-e.errno}},q:function(e,r,t){try{return r=de.getStr(r),r=de.calculateAt(e,r),0===t?le.unlink(r):512===t?le.rmdir(r):O("Invalid flags passed to unlinkat"),0}catch(e){if(void 0===le||"ErrnoError"!==e.name)throw e;return-e.errno}},B:()=>1,k:function(e,r,t){var n=me(e,r),o=new Date(1e3*n);F[t>>2]=o.getUTCSeconds(),F[t+4>>2]=o.getUTCMinutes(),F[t+8>>2]=o.getUTCHours(),F[t+12>>2]=o.getUTCDate(),F[t+16>>2]=o.getUTCMonth(),F[t+20>>2]=o.getUTCFullYear()-1900,F[t+24>>2]=o.getUTCDay();var a=Date.UTC(o.getUTCFullYear(),0,1,0,0,0,0),s=(o.getTime()-a)/864e5|0;F[t+28>>2]=s},l:function(e,r,t){var n=me(e,r),o=new Date(1e3*n);F[t>>2]=o.getSeconds(),F[t+4>>2]=o.getMinutes(),F[t+8>>2]=o.getHours(),F[t+12>>2]=o.getDate(),F[t+16>>2]=o.getMonth(),F[t+20>>2]=o.getFullYear()-1900,F[t+24>>2]=o.getDay();var a=0|ge(o);F[t+28>>2]=a,F[t+36>>2]=-60*o.getTimezoneOffset();var s=new Date(o.getFullYear(),0,1),i=new Date(o.getFullYear(),6,1).getTimezoneOffset(),u=s.getTimezoneOffset(),l=0|(i!=u&&o.getTimezoneOffset()==Math.min(u,i));F[t+32>>2]=l},m:function(e){var r=(()=>{var r=new Date(F[e+20>>2]+1900,F[e+16>>2],F[e+12>>2],F[e+8>>2],F[e+4>>2],F[e>>2],0),t=F[e+32>>2],n=r.getTimezoneOffset(),o=new Date(r.getFullYear(),0,1),a=new Date(r.getFullYear(),6,1).getTimezoneOffset(),s=o.getTimezoneOffset(),i=Math.min(s,a);if(t<0)F[e+32>>2]=Number(a!=s&&i==n);else if(t>0!=(i==n)){var u=Math.max(s,a),l=t>0?i:u;r.setTime(r.getTime()+6e4*(l-n))}F[e+24>>2]=r.getDay();var c=0|ge(r);F[e+28>>2]=c,F[e>>2]=r.getSeconds(),F[e+4>>2]=r.getMinutes(),F[e+8>>2]=r.getHours(),F[e+12>>2]=r.getDate(),F[e+16>>2]=r.getMonth(),F[e+20>>2]=r.getYear();var d=r.getTime();return isNaN(d)?(he(61),-1):d/1e3})();return Be((j=r,+Math.abs(j)>=1?j>0?+Math.floor(j/4294967296)>>>0:~~+Math.ceil((j-+(~~j>>>0))/4294967296)>>>0:0)),r>>>0},n:function(e){var r=(()=>{var r=Date.UTC(F[e+20>>2]+1900,F[e+16>>2],F[e+12>>2],F[e+8>>2],F[e+4>>2],F[e>>2],0),t=new Date(r);F[e+24>>2]=t.getUTCDay();var n=Date.UTC(t.getUTCFullYear(),0,1,0,0,0,0),o=(t.getTime()-n)/864e5|0;return F[e+28>>2]=o,t.getTime()/1e3})();return Be((j=r,+Math.abs(j)>=1?j>0?+Math.floor(j/4294967296)>>>0:~~+Math.ceil((j-+(~~j>>>0))/4294967296)>>>0:0)),r>>>0},r:(e,r,t)=>{var n=(new Date).getFullYear(),o=new Date(n,0,1),a=new Date(n,6,1),s=o.getTimezoneOffset(),i=a.getTimezoneOffset(),u=Math.max(s,i);function l(e){var r=e.toTimeString().match(/\(([A-Za-z ]+)\)$/);return r?r[1]:"GMT"}D[e>>2]=60*u,F[r>>2]=Number(s!=i);var c=l(o),d=l(a),h=ye(c),f=ye(d);i<s?(D[t>>2]=h,D[t+4>>2]=f):(D[t>>2]=f,D[t+4>>2]=h)},b:()=>{O("")},c:()=>Date.now(),h:(e,r,t)=>k.copyWithin(e,r,r+t),p:e=>{var r=k.length,t=2147483648;if((e>>>=0)>t)return!1;for(var n,o,a=1;a<=4;a*=2){var s=r*(1+.2/a);s=Math.min(s,e+100663296);var i=Math.min(t,(n=Math.max(e,s))+((o=65536)-n%o)%o);if(Ee(i))return!0}return!1},z:(e,r)=>{var t=0;return ke().forEach(((n,o)=>{var a=r+t;D[e+4*o>>2]=a,((e,r)=>{for(var t=0;t<e.length;++t)E[r++>>0]=e.charCodeAt(t);E[r>>0]=0})(n,a),t+=n.length+1})),0},A:(e,r)=>{var t=ke();D[e>>2]=t.length;var n=0;return t.forEach((e=>n+=e.length+1)),D[r>>2]=n,0},g:Fe,e:function(e){try{var r=de.getStreamFromFD(e);return le.close(r),0}catch(e){if(void 0===le||"ErrnoError"!==e.name)throw e;return e.errno}},j:function(e,r,t,n){try{var o=((e,r,t,n)=>{for(var o=0,a=0;a<t;a++){var s=D[r>>2],i=D[r+4>>2];r+=8;var u=le.read(e,E,s,i,n);if(u<0)return-1;if(o+=u,u<i)break;void 0!==n&&(n+=u)}return o})(de.getStreamFromFD(e),r,t);return D[n>>2]=o,0}catch(e){if(void 0===le||"ErrnoError"!==e.name)throw e;return e.errno}},o:function(e,r,t,n,o){var a=me(r,t);try{if(isNaN(a))return 61;var s=de.getStreamFromFD(e);return le.llseek(s,a,n),I=[s.position>>>0,(j=s.position,+Math.abs(j)>=1?j>0?+Math.floor(j/4294967296)>>>0:~~+Math.ceil((j-+(~~j>>>0))/4294967296)>>>0:0)],F[o>>2]=I[0],F[o+4>>2]=I[1],s.getdents&&0===a&&0===n&&(s.getdents=null),0}catch(e){if(void 0===le||"ErrnoError"!==e.name)throw e;return e.errno}},d:function(e,r,t,n){try{var o=((e,r,t,n)=>{for(var o=0,a=0;a<t;a++){var s=D[r>>2],i=D[r+4>>2];r+=8;var u=le.write(e,E,s,i,n);if(u<0)return-1;o+=u,void 0!==n&&(n+=u)}return o})(de.getStreamFromFD(e),r,t);return D[n>>2]=o,0}catch(e){if(void 0===le||"ErrnoError"!==e.name)throw e;return e.errno}},f:(e,r,t,n)=>{var o=D[n+40>>2],a={tm_sec:F[n>>2],tm_min:F[n+4>>2],tm_hour:F[n+8>>2],tm_mday:F[n+12>>2],tm_mon:F[n+16>>2],tm_year:F[n+20>>2],tm_wday:F[n+24>>2],tm_yday:F[n+28>>2],tm_isdst:F[n+32>>2],tm_gmtoff:F[n+36>>2],tm_zone:o?ce(o):""},s=ce(t),i={"%c":"%a %b %d %H:%M:%S %Y","%D":"%m/%d/%y","%F":"%Y-%m-%d","%h":"%b","%r":"%I:%M:%S %p","%R":"%H:%M","%T":"%H:%M:%S","%x":"%m/%d/%y","%X":"%H:%M:%S","%Ec":"%c","%EC":"%C","%Ex":"%m/%d/%y","%EX":"%H:%M:%S","%Ey":"%y","%EY":"%Y","%Od":"%d","%Oe":"%e","%OH":"%H","%OI":"%I","%Om":"%m","%OM":"%M","%OS":"%S","%Ou":"%u","%OU":"%U","%OV":"%V","%Ow":"%w","%OW":"%W","%Oy":"%y"};for(var u in i)s=s.replace(new RegExp(u,"g"),i[u]);var l=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],c=["January","February","March","April","May","June","July","August","September","October","November","December"];function d(e,r,t){for(var n="number"==typeof e?e.toString():e||"";n.length<r;)n=t[0]+n;return n}function h(e,r){return d(e,r,"0")}function f(e,r){function t(e){return e<0?-1:e>0?1:0}var n;return 0===(n=t(e.getFullYear()-r.getFullYear()))&&0===(n=t(e.getMonth()-r.getMonth()))&&(n=t(e.getDate()-r.getDate())),n}function m(e){switch(e.getDay()){case 0:return new Date(e.getFullYear()-1,11,29);case 1:return e;case 2:return new Date(e.getFullYear(),0,3);case 3:return new Date(e.getFullYear(),0,2);case 4:return new Date(e.getFullYear(),0,1);case 5:return new Date(e.getFullYear()-1,11,31);case 6:return new Date(e.getFullYear()-1,11,30)}}function p(e){var r=((e,r)=>{for(var t=new Date(e.getTime());r>0;){var n=pe(t.getFullYear()),o=t.getMonth(),a=(n?De:Me)[o];if(!(r>a-t.getDate()))return t.setDate(t.getDate()+r),t;r-=a-t.getDate()+1,t.setDate(1),o<11?t.setMonth(o+1):(t.setMonth(0),t.setFullYear(t.getFullYear()+1))}return t})(new Date(e.tm_year+1900,0,1),e.tm_yday),t=new Date(r.getFullYear(),0,4),n=new Date(r.getFullYear()+1,0,4),o=m(t),a=m(n);return f(o,r)<=0?f(a,r)<=0?r.getFullYear()+1:r.getFullYear():r.getFullYear()-1}var v={"%a":e=>l[e.tm_wday].substring(0,3),"%A":e=>l[e.tm_wday],"%b":e=>c[e.tm_mon].substring(0,3),"%B":e=>c[e.tm_mon],"%C":e=>h((e.tm_year+1900)/100|0,2),"%d":e=>h(e.tm_mday,2),"%e":e=>d(e.tm_mday,2," "),"%g":e=>p(e).toString().substring(2),"%G":e=>p(e),"%H":e=>h(e.tm_hour,2),"%I":e=>{var r=e.tm_hour;return 0==r?r=12:r>12&&(r-=12),h(r,2)},"%j":e=>h(e.tm_mday+((e,r)=>{for(var t=0,n=0;n<=r;t+=e[n++]);return t})(pe(e.tm_year+1900)?De:Me,e.tm_mon-1),3),"%m":e=>h(e.tm_mon+1,2),"%M":e=>h(e.tm_min,2),"%n":()=>"\n","%p":e=>e.tm_hour>=0&&e.tm_hour<12?"AM":"PM","%S":e=>h(e.tm_sec,2),"%t":()=>"\t","%u":e=>e.tm_wday||7,"%U":e=>{var r=e.tm_yday+7-e.tm_wday;return h(Math.floor(r/7),2)},"%V":e=>{var r=Math.floor((e.tm_yday+7-(e.tm_wday+6)%7)/7);if((e.tm_wday+371-e.tm_yday-2)%7<=2&&r++,r){if(53==r){var t=(e.tm_wday+371-e.tm_yday)%7;4==t||3==t&&pe(e.tm_year)||(r=1)}}else{r=52;var n=(e.tm_wday+7-e.tm_yday-1)%7;(4==n||5==n&&pe(e.tm_year%400-1))&&r++}return h(r,2)},"%w":e=>e.tm_wday,"%W":e=>{var r=e.tm_yday+7-(e.tm_wday+6)%7;return h(Math.floor(r/7),2)},"%y":e=>(e.tm_year+1900).toString().substring(2),"%Y":e=>e.tm_year+1900,"%z":e=>{var r=e.tm_gmtoff,t=r>=0;return r=(r=Math.abs(r)/60)/60*100+r%60,(t?"+":"-")+String("0000"+r).slice(-4)},"%Z":e=>e.tm_zone,"%%":()=>"%"};for(var u in s=s.replace(/%%/g,"\0\0"),v)s.includes(u)&&(s=s.replace(new RegExp(u,"g"),v[u](a)));var w=ne(s=s.replace(/\0\0/g,"%"),!1);return w.length>r?0:(Ae(w,e),w.length-1)}},Le=function(){var e,r,o,a,s={a:Ue};function i(e,r){var t;return Le=e.exports,g=Le.C,C(),t=Le.D,T.unshift(t),x(),Le}if(L(),n.instantiateWasm)try{return n.instantiateWasm(s,i)}catch(e){y(''Module.instantiateWasm callback failed with error: {{e}''),t(e)}return(e=w,r=N,o=s,a=function(e){i(e.instance)},e||"function"!=typeof WebAssembly.instantiateStreaming||H(r)||Y(r)||h||"function"!=typeof fetch?K(r,o,a):fetch(r,{credentials:"same-origin"}).then((e=>WebAssembly.instantiateStreaming(e,o).then(a,(function(e){return y(''wasm streaming compile failed: {{e}''),y("falling back to ArrayBuffer instantiation"),K(r,o,a)}))))).catch(t),{}}();n._get_version=()=>(n._get_version=Le.E)(),n._archive_open=(e,r,t,o)=>(n._archive_open=Le.F)(e,r,t,o),n._archive_read_add_passphrase=(e,r)=>(n._archive_read_add_passphrase=Le.G)(e,r),n._archive_error_string=e=>(n._archive_error_string=Le.H)(e),n._get_next_entry=e=>(n._get_next_entry=Le.I)(e),n._get_filedata=(e,r)=>(n._get_filedata=Le.J)(e,r);var xe=n._malloc=e=>(xe=n._malloc=Le.K)(e);n._archive_close=e=>(n._archive_close=Le.L)(e),n._start_archive_write=(e,r,t,o,a,s)=>(n._start_archive_write=Le.M)(e,r,t,o,a,s),n._write_archive_file=(e,r,t,o)=>(n._write_archive_file=Le.N)(e,r,t,o),n._size_of_size_t=()=>(n._size_of_size_t=Le.O)(),n._finish_archive_write=(e,r)=>(n._finish_archive_write=Le.P)(e,r),n._free=e=>(n._free=Le.Q)(e);var Oe=()=>(Oe=Le.R)();n._archive_entry_birthtime_nsec=e=>(n._archive_entry_birthtime_nsec=Le.S)(e),n._archive_entry_filetype=e=>(n._archive_entry_filetype=Le.T)(e),n._archive_entry_mtime_nsec=e=>(n._archive_entry_mtime_nsec=Le.U)(e),n._archive_entry_pathname=e=>(n._archive_entry_pathname=Le.V)(e),n._archive_entry_pathname_utf8=e=>(n._archive_entry_pathname_utf8=Le.W)(e),n._archive_entry_size=e=>(n._archive_entry_size=Le.X)(e),n._archive_entry_is_encrypted=e=>(n._archive_entry_is_encrypted=Le.Y)(e),n._archive_read_has_encrypted_entries=e=>(n._archive_read_has_encrypted_entries=Le.Z)(e),n._archive_read_data_skip=e=>(n._archive_read_data_skip=Le._)(e);var Ne,Be=e=>(Be=Le.aa)(e),je=()=>(je=Le.ba)(),Ie=e=>(Ie=Le.ca)(e),He=e=>(He=Le.da)(e);function Ye(){function e(){Ne||(Ne=!0,n.calledRun=!0,M||(n.noFSInit||le.init.initialized||le.init(),le.ignorePermissions=!1,fe.root=le.mount(fe,{},null),$(T),r(n),n.onRuntimeInitialized&&n.onRuntimeInitialized(),function(){if(n.postRun)for("function"==typeof n.postRun&&(n.postRun=[n.postRun]);n.postRun.length;)e=n.postRun.shift(),R.unshift(e);var e;$(R)}()))}z>0||(function(){if(n.preRun)for("function"==typeof n.preRun&&(n.preRun=[n.preRun]);n.preRun.length;)e=n.preRun.shift(),P.unshift(e);var e;$(P)}(),z>0||(n.setStatus?(n.setStatus("Running..."),setTimeout((function(){setTimeout((function(){n.setStatus("")}),1),e()}),1)):e()))}if(n.cwrap=(e,r,t,n)=>{var o=!t||t.every((e=>"number"===e||"boolean"===e));return"string"!==r&&o&&!n?Ce(e):function(){return Pe(e,r,t,arguments)}},n.allocate=(e,r)=>{var t;return t=1==r?He(e.length):xe(e.length),e.subarray||e.slice||(e=new Uint8Array(e)),k.set(e,t),t},U=function e(){Ne||Ye(),Ne||(U=e)},n.preInit)for("function"==typeof n.preInit&&(n.preInit=[n.preInit]);n.preInit.length>0;)n.preInit.pop()();return Ye(),e.ready});class S{constructor(){this.preRun=[],this.postRun=[],this.totalDependencies=0}print(...e){console.log(e)}printErr(...e){console.error(e)}initFunctions(){this.runCode={getVersion:this.cwrap("get_version","string",[]),openArchive:this.cwrap("archive_open","number",["number","number","string","string"]),getNextEntry:this.cwrap("get_next_entry","number",["number"]),getFileData:this.cwrap("get_filedata","number",["number","number"]),skipEntry:this.cwrap("archive_read_data_skip","number",["number"]),closeArchive:this.cwrap("archive_close",null,["number"]),getEntrySize:this.cwrap("archive_entry_size","number",["number"]),getEntryName:this.cwrap("archive_entry_pathname","string",["number"]),getEntryType:this.cwrap("archive_entry_filetype","number",["number"]),getEntryLastModified:this.cwrap("archive_entry_mtime_nsec","number",["number"]),getError:this.cwrap("archive_error_string","string",["number"]),startArchiveWrite:this.cwrap("start_archive_write","number",["string","string","number","number","number","string"]),writeArchiveFile:this.cwrap("write_archive_file",null,["number","string","number","number"]),finishArchiveWrite:this.cwrap("finish_archive_write","number",["number","number"]),entryIsEncrypted:this.cwrap("archive_entry_is_encrypted","number",["number"]),hasEncryptedEntries:this.cwrap("archive_read_has_encrypted_entries","number",["number"]),addPassphrase:this.cwrap("archive_read_add_passphrase","number",["number","string"]),string:e=>this.allocate(this.intArrayFromString(e),"i8",0),malloc:this.cwrap("malloc","number",["number"]),free:this.cwrap("free",null,["number"]),sizeOfSizeT:this.cwrap("size_of_size_t","number",[])}}monitorRunDependencies(){}}let F=null,D=null,M=!1;class A{constructor(e){A.readyCallback=e,M&&setTimeout((()=>e()),0)}open(e,r){F.open(e).then((()=>r()))}listFiles(){let e=[];for(const r of F.entries(!0))e.push(r);return e}extractFiles(){let e=[];for(const r of F.entries(!1))e.push(r);return e}extractSingleFile(e){for(const r of F.entries(!0,e))if(r.fileData)return r}hasEncryptedData(){return F.hasEncryptedData()}usePassword(e){F.setPassphrase(e)}setLocale(e){F.setLocale(e)}writeArchive(e,r,t,n){return D.write(e,r,t,n)}close(){F.close()}}var C;C=e=>{F=new y(e),D=new E(e),A?.readyCallback?.(),M=!0},k(new S).then((e=>{e.initFunctions(),C(e)})),i(A);`;
        const blob = new Blob([text.replaceAll("''", '`').replaceAll("{{", '${')], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        return new Worker(blobUrl, { type: 'module', crossorigin: 'anonymous' });
    }
    static async getClient(e, t) {
        var n;
        const r = (null === (n = t.createClient) || void 0 === n ? void 0 : n.call(t, e)) || l(e);
        let {
            promise: i,
            resolve: s
        } = Promise.withResolvers();
        const a = await new r(w((() => {
            s()
        })));
        return await i, a
    }
}
O._options = {}, Promise.withResolvers || (Promise.withResolvers = function () {
    var e, t, n = new this((function (n, r) {
        e = n, t = r
    }));
    return {
        resolve: e,
        reject: t,
        promise: n
    }
});
export {
    O as Archive, k as ArchiveCompression, _ as ArchiveFormat
};