function dataURLtoBlob(a) {
    for (var g, b = a.split(","), c = b[0].match(/:(.*?);/)[1], d = atob(b[1]), e = d.length, f = new Uint8Array(e); e--;) f[e] = d.charCodeAt(e);
    try {
        g = new Blob([f], {
            type: c
        })
    } catch(h) {
        if (window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder, "TypeError" == h.name && window.BlobBuilder) {
            var i = new BlobBuilder;
            i.append(f.buffer),
            g = i.getBlob(c)
        } else g = "InvalidStateError" == h.name ? new Blob(f.buffer, {
            type: c
        }) : new Blob([f], {
            type: c
        })
    }
    return g
}
function Map() {
    this.container = new Object
}
ArrayBuffer.prototype.slice || (ArrayBuffer.prototype.slice = function(a, b) {
    if (void 0 === a && (a = 0), void 0 === b && (b = this.byteLength), a = Math.floor(a), b = Math.floor(b), 0 > a && (a += this.byteLength), 0 > b && (b += this.byteLength), a = Math.min(Math.max(0, a), this.byteLength), b = Math.min(Math.max(0, b), this.byteLength), 0 >= b - a) return new ArrayBuffer(0);
    var c = new ArrayBuffer(b - a),
    d = new Uint8Array(c),
    e = new Uint8Array(this, a, b - a);
    return d.set(e),
    c
});
var Gif = function(a) {
    var b = this;
    this.frames = a,
    this.length = 0,
    this.offsets = [],
    a.forEach(function(a) {
        b.offsets.push(b.length),
        b.length += a.delay || defaultFrameDelay
    })
};
Gif.prototype.frameAt = function(a) {
    for (var b = a * this.length,
    c = 1,
    d = this.offsets.length; d > c && !(this.offsets[c] > b); c++);
    return c - 1
};
var StreamReader = function(a) {
    this.data = new Uint8Array(a),
    this.index = 0,
    this.log("TOTAL LENGTH: " + this.data.length)
};
StreamReader.prototype.finished = function() {
    return this.index >= this.data.length
},
StreamReader.prototype.readByte = function() {
    return this.data[this.index++]
},
StreamReader.prototype.peekByte = function() {
    return this.data[this.index]
},
StreamReader.prototype.skipBytes = function(a) {
    this.index += a
},
StreamReader.prototype.peekBit = function(a) {
    return !! (this.peekByte() & 1 << 8 - a)
},
StreamReader.prototype.readAscii = function(a) {
    for (var b = "",
    c = 0; a > c; c++) b += String.fromCharCode(this.readByte());
    return b
},
StreamReader.prototype.isNext = function(a) {
    for (var b = 0; b < a.length; b++) if (a[b] !== this.data[this.index + b]) return ! 1;
    return ! 0
},
StreamReader.prototype.log = function(a) {},
StreamReader.prototype.error = function(a) {
    console.error(this.index + ": " + a)
};
var url = window.URL && window.URL.createObjectURL ? window.URL: window.webkitURL,
gifCache = new Map,
Exploder = function(a) {
    this.file = a,
    this.onload = null,
    this.onerror = null
};
Exploder.prototype.load = function() {
    var f, a = this,
    c = (gifCache.get(this.file), a.file),
    d = "*/*",
    e = "arraybuffer",
    g = new XMLHttpRequest;
    g.open("GET", c, !0),
    g.setRequestHeader("Accept", d),
    g.responseType = e,
    g.onload = function() {
        200 == this.status ? (f = a.explode(this.response), gifCache.set(this.file, f)) : a.onerror(this.statusText)
    },
    g.onerror = function() {
        a.onerror("Network Error")
    },
    g.send()
},


Exploder.prototype.fix=function(a,b,c,d){
	for(var e=window.URL&&window.URL.createObjectURL?window.URL:window.webkitURL,f=this,g=0;g<a.length;g++){
		var h=$("<canvas></canvas>"),i=h[0],j=i.getContext("2d");
        i.width=d;
        i.height=c;
		if(0==a[g].disposal||0==g){
			if( (b[g].width!=d||b[g].height!=c)&&b[g].width>0&&a[g].left+a[g].top>0 ){
				j.drawImage(b[g],0,0,b[g].width,b[g].height,a[g].left,a[g].top,b[g].width,b[g].height)
			}else{
				try{
					j.drawImage(b[g],0,0,d,c,0,0,d,c);
				}catch(e){
					console.error(e);
				}
				a[g].canvas=h;
			}
		}else if(g>0&&1==a[g].disposal&&null!=a[g-1].canvas){
            var k=a[g-1].canvas[0],l=k.getContext("2d"),m=l.getImageData(0,0,k.width,k.height);
            j.putImageData(m,0,0);
            if( (b[g].width!=d||b[g].height!=c)&&b[g].width>0&&a[g].left+a[g].top>0){
                j.drawImage(b[g],0,0,b[g].width,b[g].height,a[g].left,a[g].top,b[g].width,b[g].height);
            }else{
                j.drawImage(b[g],0,0,d,c,0,0,d,c)
            }
            a[g].canvas=h
        }

        var n=i.toDataURL("image/png"),o=dataURLtoBlob(n),p=e.createObjectURL(o);
        a[g].url=p,a[g].blob=o,a[g].disposal=0,a[g].dataurl=n
    }
    f.onload(a)
},

Exploder.prototype.explode=function(a){
    var b=window.URL&&window.URL.createObjectURL?window.URL:window.webkitURL,
        c=this,
        d=[],
        e=gify.getInfo(a,!0),
        f=a.slice(0,e.gifHeaderindex),
        g=a.slice(-1);

    if(e.images.length>0){
        for(var h=0;h<e.images.length;h++){
            var i=e.images[h].nextindex,j=e.images[h].index;
            0==i&&(i=a.byteLength-1);
            try{
                frameblob=new Blob([f,a.slice(j,i),g],{type:"image/gif"})
            }catch(k){
                if(window.BlobBuilder=window.BlobBuilder||window.WebKitBlobBuilder||window.MozBlobBuilder||window.MSBlobBuilder,"TypeError"==k.name&&window.BlobBuilder){
                    var l=new BlobBuilder;
                    l.append(f);
                    l.append(a.slice(j,i));
                    l.append(g);
                    frameblob=l.getBlob("image/gif");
                }else{
                    if("InvalidStateError"==k.name){
                        frameblob=new Blob([f,a.slice(j,i),g],{type:"image/gif"});
                    }else{
                        frameblob=new Blob([f,a.slice(j,i),g],{type:"image/gif"})
                    }
                }
            }
            var m=b.createObjectURL(frameblob),
                n=e.images[h].identifier,
                o=e.images[h].delay/10,
                p=e.images[h].disposal,
                q=e.images[h].left,
                r=e.images[h].top,
                s=e.images[h].width,
                t=e.images[h].height;

            4==p&&(p=1);
            p%2==0&&(p=0);
            3==p&&(p=h>0&&3==e.images[h-1].disposal?1:0);

            5==p&&(p=1,p=0==h?0:9!=e.images[h-1].disposal?1:0,h<e.images.length-1&&(e.images[h+1].disposal=1),h<e.images.length-2&&(e.images[h+2].disposal=1));

    	    9==p&&h>0&&(5==e.images[h-1].disposal||3==e.images[h-1].disposal)?
    		p=1:
    		9==p&&(p=0),
    		21==p&&(p=1),
    		0!=p&&1!=p&&(p=0),
    		d.push({index:n,delay:o,disposal:p,url:m,blob:frameblob,left:q,top:r,width:s,height:t,img:null,canvas:null})

        }

        console.log("#############################"),
        console.log(e),console.log(d),
        console.log("#############################");

        for(var u=0,v=new Array,w=0;w<d.length;w++){
        	var x=new Image;
        	v[w]=x,
        	x.onload=function(){
        		u+=1,u==d.length&&c.fix(d,v,e.width,e.height)
        	},
        	x.onerror=function(){
        		//console.log(u, this.src,d[u])
        		u+=1,u==d.length&&c.fix(d,v,e.width,e.height)
        	},
        	x.src=d[w].url
        }

    }else c.onerror("Not a GIF!")


},

Exploder.prototype.onload=null,
Exploder.prototype.onerror=null;

var Promises={
    xhrGet:function(a,b,c){
        return new Promise(function(d,e){
            var f=new XMLHttpRequest;
            f.open("GET",a,!0),
            f.setRequestHeader("Accept",b),
            f.responseType=c,
            f.onload=function(){
                200==this.status?d(this.response):e(Error(this.statusText))
            },
            f.onerror=function(){
                e(Error("Network Error"))
            },
            f.send()
        })
    }
};

Map.prototype.put=function(a,b){
    this.container[a]=b
},
Map.prototype.get=function(a){
    return this.container[a]
},
Map.prototype.set=function(){
    var a=new Array,b=0;
    for(var c in this.container)"extend"!=c&&(a[b]=c,b++);
    return a
},
Map.prototype.size=function(){
    var a=0;
    for(var b in this.container)"extend"!=b&&a++;
        return a
},
Map.prototype.remove=function(a){
    delete this.container[a]
};
var gify=function(){
    "use strict";
    function b(a){
        return 3*Math.pow(2,1+e(a.slice(5,8)))
    }
    function c(a){
        for(var b=[],c=7;c>=0;c--)b.push(a&1<<c?1:0);
        return b
    }
    function d(a){return a/100*1e3}
    function e(a){return a.reduce(function(a,b){return 2*a+b},0)}
    function f(a,b,c){for(var d={data:"",size:0};;){var e=a.getUint8(b+d.size,!0);if(0===e){d.size++;break}c&&(d.data+=a.getString(e,b+d.size+1)),d.size+=e+1}return d}
    function g(){return{identifier:"0",localPalette:!1,localPaletteSize:0,interlace:!1,comments:[],text:"",left:0,top:0,width:0,height:0,delay:0,disposal:0,index:0,nextindex:0}}
    function h(e,h){
        //console.log('e:',e)
        var i=0,l=0,m={
                valid:!1,
                globalPalette:!1,
                globalPaletteSize:0,
                loopCount:0,
                height:0,
                width:0,
                animated:!1,
                images:[],
                isBrowserDuration:!1,
                duration:0,
                durationIE:0,
                durationSafari:0,
                durationFirefox:0,
                durationChrome:0,
                durationOpera:0,
                gifHeaderindex:0
            }, n=new jDataView(e);

        if(e.byteLength<10)return m;
        if(18249!=n.getUint16(0)||17976!=n.getUint16(2))return m;
        m.height=n.getUint16(6,!0);
        m.width=n.getUint16(8,!0);
        m.valid=!0;
        var o=c(n.getUint8(10,!0));
        if(o[0]){
            var p=b(o);
            m.globalPalette=!0,m.globalPaletteSize=p/3,i+=p
        }
        i+=13,m.gifHeaderindex=i;
        for(var q=g();;){
            try{
                var r=n.getUint8(i,!0);
                switch(r){
                    case 33:
                    var s=n.getUint8(i+1,!0);
                    if(249===s){
                        var t=n.getUint8(i+2);
                        if(4===t){
                            var u=d(n.getUint16(i+4,!0));
                            60>u&&!m.isBrowserDuration&&(m.isBrowserDuration=!0),
                            q.delay=u,
                            m.duration+=u,
                            m.durationIE+=60>u?a:u,
                            m.durationSafari+=20>u?a:u,
                            m.durationChrome+=20>u?a:u,
                            m.durationFirefox+=20>u?a:u,
                            m.durationOpera+=20>u?a:u;
                            var o=c(n.getUint8(i+3)),v=o.slice(3,8).join("");
                            q.disposal=parseInt(v,2),i+=8
                        }else i++;
                        q.index=i-8
                    }else{
                        i+=2;
                        var w=f(n,i,!0);
                        switch(s){
                            case 255:m.loopCount=n.getUint8(i+16,!0);break;
                            case 206:q.identifier=w.data;break;
                            case 254:q.comments.push(w.data);break;
                            case 1:q.text=w.data
                        }
                        i+=w.size
                    }
                    break;
                    case 44:
                        q.left=n.getUint16(i+1,!0),
                        q.top=n.getUint16(i+3,!0),
                        q.width=n.getUint16(i+5,!0),
                        q.height=n.getUint16(i+7,!0);
                        var o=c(n.getUint8(i+9,!0));
                        if(o[0]){
                            var x=b(o);
                            q.localPalette=!0,
                            q.localPaletteSize=x/3,
                            i+=x
                        }
                        if(
                            o[1]&&(q.interlace=!0),
                            m.images.length>0&&(m.images[m.images.length-1].nextindex=q.index),
                            m.images.push(q),
                            l++,
                            q=g(),
                            q.identifier=l.toString(),
                            m.images.length>1&&!m.animated&&(m.animated=!0,h)
                        )return m;
                        i+=11;
                        var w=f(n,i,!1);
                        i+=w.size;
                        break;
                    case 59:
                        return m;
                    default:i++
                }
            }catch(y){
                return m.valid=!1,m
            }
            if(i>=e.byteLength)return m
        }
        return m
    }
    var a=100;
    return{
        isAnimated:function(a){var b=h(a,!0);return b.animated},

        getInfo:function(a){
            return h(a,!1)
        }

    }
}();!function(a){var b={ArrayBuffer:"undefined"!=typeof ArrayBuffer,DataView:"undefined"!=typeof DataView&&("getFloat64"in DataView.prototype||"getFloat64"in new DataView(new ArrayBuffer(1))),NodeBuffer:"undefined"!=typeof Buffer&&"readInt16LE"in Buffer.prototype},c={Int8:1,Int16:2,Int32:4,Uint8:1,Uint16:2,Uint32:4,Float32:4,Float64:8},d={Int8:"Int8",Int16:"Int16",Int32:"Int32",Uint8:"UInt8",Uint16:"UInt16",Uint32:"UInt32",Float32:"Float",Float64:"Double"},e=function(f,g,h,i){if(!(this instanceof e))throw new Error("jDataView constructor may not be called as a function");if(this.buffer=f,!(b.NodeBuffer&&f instanceof Buffer||b.ArrayBuffer&&f instanceof ArrayBuffer||"string"==typeof f))throw new TypeError("jDataView buffer has an incompatible type");this._isArrayBuffer=b.ArrayBuffer&&f instanceof ArrayBuffer,this._isDataView=b.DataView&&this._isArrayBuffer,this._isNodeBuffer=b.NodeBuffer&&f instanceof Buffer,this._littleEndian=void 0===i?!1:i;var j=this._isArrayBuffer?f.byteLength:f.length;if(void 0===g&&(g=0),this.byteOffset=g,void 0===h&&(h=j-g),this.byteLength=h,!this._isDataView){if("number"!=typeof g)throw new TypeError("jDataView byteOffset is not a number");if("number"!=typeof h)throw new TypeError("jDataView byteLength is not a number");if(0>g)throw new Error("jDataView byteOffset is negative");if(0>h)throw new Error("jDataView byteLength is negative")}if(this._isDataView&&(this._view=new DataView(f,g,h),this._start=0),this._start=g,g+h>j)throw new Error("jDataView (byteOffset + byteLength) value is out of bounds");if(this._offset=0,this._isDataView)for(var k in c)c.hasOwnProperty(k)&&!function(a,b){var d=c[a];b["get"+a]=function(c,e){return void 0===e&&(e=b._littleEndian),void 0===c&&(c=b._offset),b._offset=c+d,b._view["get"+a](c,e)}}(k,this);else if(this._isNodeBuffer&&b.NodeBuffer){for(var k in c)if(c.hasOwnProperty(k)){var l;l="Int8"===k||"Uint8"===k?"read"+d[k]:i?"read"+d[k]+"LE":"read"+d[k]+"BE",function(a,b,d){var e=c[a];b["get"+a]=function(a,c){return void 0===c&&(c=b._littleEndian),void 0===a&&(a=b._offset),b._offset=a+e,b.buffer[d](b._start+a)}}(k,this,l)}}else for(var k in c)c.hasOwnProperty(k)&&!function(b,d){var e=c[b];d["get"+b]=function(c,f){if(void 0===f&&(f=d._littleEndian),void 0===c&&(c=d._offset),d._offset=c+e,d._isArrayBuffer&&(d._start+c)%e===0&&(1===e||f))return new a[b+"Array"](d.buffer,d._start+c,1)[0];if("number"!=typeof c)throw new TypeError("jDataView byteOffset is not a number");if(c+e>d.byteLength)throw new Error("jDataView (byteOffset + size) value is out of bounds");return d["_get"+b](d._start+c,f)}}(k,this)};if(b.NodeBuffer?e.createBuffer=function(){for(var a=new Buffer(arguments.length),b=0;b<arguments.length;++b)a[b]=arguments[b];return a}:b.ArrayBuffer?e.createBuffer=function(){for(var a=new ArrayBuffer(arguments.length),b=new Int8Array(a),c=0;c<arguments.length;++c)b[c]=arguments[c];return a}:e.createBuffer=function(){return String.fromCharCode.apply(null,arguments)},e.prototype={compatibility:b,getString:function(a,b){var c;if(void 0===b&&(b=this._offset),"number"!=typeof b)throw new TypeError("jDataView byteOffset is not a number");if(0>a||b+a>this.byteLength)throw new Error("jDataView length or (byteOffset+length) value is out of bounds");if(this._isNodeBuffer)c=this.buffer.toString("ascii",this._start+b,this._start+b+a);else{c="";for(var d=0;a>d;++d){var e=this.getUint8(b+d);c+=String.fromCharCode(e>127?65533:e)}}return this._offset=b+a,c},getChar:function(a){return this.getString(1,a)},tell:function(){return this._offset},seek:function(a){if("number"!=typeof a)throw new TypeError("jDataView byteOffset is not a number");if(0>a||a>this.byteLength)throw new Error("jDataView byteOffset value is out of bounds");return this._offset=a},_endianness:function(a,b,c,d){return a+(d?c-b-1:b)},_getFloat64:function(a,b){var c=this._getUint8(this._endianness(a,0,8,b)),d=this._getUint8(this._endianness(a,1,8,b)),e=this._getUint8(this._endianness(a,2,8,b)),f=this._getUint8(this._endianness(a,3,8,b)),g=this._getUint8(this._endianness(a,4,8,b)),h=this._getUint8(this._endianness(a,5,8,b)),i=this._getUint8(this._endianness(a,6,8,b)),j=this._getUint8(this._endianness(a,7,8,b)),k=1-2*(c>>7),l=((c<<1&255)<<3|d>>4)-(Math.pow(2,10)-1),m=(15&d)*Math.pow(2,48)+e*Math.pow(2,40)+f*Math.pow(2,32)+g*Math.pow(2,24)+h*Math.pow(2,16)+i*Math.pow(2,8)+j;return 1024===l?0!==m?NaN:k*(1/0):-1023===l?k*m*Math.pow(2,-1074):k*(1+m*Math.pow(2,-52))*Math.pow(2,l)},_getFloat32:function(a,b){var c=this._getUint8(this._endianness(a,0,4,b)),d=this._getUint8(this._endianness(a,1,4,b)),e=this._getUint8(this._endianness(a,2,4,b)),f=this._getUint8(this._endianness(a,3,4,b)),g=1-2*(c>>7),h=(c<<1&255|d>>7)-127,i=(127&d)<<16|e<<8|f;return 128===h?0!==i?NaN:g*(1/0):-127===h?g*i*Math.pow(2,-149):g*(1+i*Math.pow(2,-23))*Math.pow(2,h)},_getInt32:function(a,b){var c=this._getUint32(a,b);return c>Math.pow(2,31)-1?c-Math.pow(2,32):c},_getUint32:function(a,b){var c=this._getUint8(this._endianness(a,0,4,b)),d=this._getUint8(this._endianness(a,1,4,b)),e=this._getUint8(this._endianness(a,2,4,b)),f=this._getUint8(this._endianness(a,3,4,b));return c*Math.pow(2,24)+(d<<16)+(e<<8)+f},_getInt16:function(a,b){var c=this._getUint16(a,b);return c>Math.pow(2,15)-1?c-Math.pow(2,16):c},_getUint16:function(a,b){var c=this._getUint8(this._endianness(a,0,2,b)),d=this._getUint8(this._endianness(a,1,2,b));return(c<<8)+d},_getInt8:function(a){var b=this._getUint8(a);return b>Math.pow(2,7)-1?b-Math.pow(2,8):b},_getUint8:function(a){return this._isArrayBuffer?new Uint8Array(this.buffer,a,1)[0]:this._isNodeBuffer?this.buffer[a]:255&this.buffer.charCodeAt(a)}},"undefined"!=typeof jQuery&&jQuery.fn.jquery>="1.6.2"){var f=function(a){var b;try{b=IEBinaryToArray_ByteStr(a)}catch(c){var d="Function IEBinaryToArray_ByteStr(Binary)\r\n	IEBinaryToArray_ByteStr = CStr(Binary)\r\nEnd Function\r\nFunction IEBinaryToArray_ByteStr_Last(Binary)\r\n	Dim lastIndex\r\n	lastIndex = LenB(Binary)\r\n	if lastIndex mod 2 Then\r\n		IEBinaryToArray_ByteStr_Last = AscB( MidB( Binary, lastIndex, 1 ) )\r\n	Else\r\n		IEBinaryToArray_ByteStr_Last = -1\r\n	End If\r\nEnd Function\r\n";window.execScript(d,"vbscript"),b=IEBinaryToArray_ByteStr(a)}for(var i,e=IEBinaryToArray_ByteStr_Last(a),f="",g=0,h=b.length%8;h>g;)i=b.charCodeAt(g++),f+=String.fromCharCode(255&i,i>>8);for(h=b.length;h>g;)f+=String.fromCharCode((i=b.charCodeAt(g++),255&i),i>>8,(i=b.charCodeAt(g++),255&i),i>>8,(i=b.charCodeAt(g++),255&i),i>>8,(i=b.charCodeAt(g++),255&i),i>>8,(i=b.charCodeAt(g++),255&i),i>>8,(i=b.charCodeAt(g++),255&i),i>>8,(i=b.charCodeAt(g++),255&i),i>>8,(i=b.charCodeAt(g++),255&i),i>>8);return e>-1&&(f+=String.fromCharCode(e)),f};jQuery.ajaxSetup({converters:{"* dataview":function(a){return new e(a)}},accepts:{dataview:"text/plain; charset=x-user-defined"},responseHandler:{dataview:function(a,b,c){"mozResponseArrayBuffer"in c?a.text=c.mozResponseArrayBuffer:"responseType"in c&&"arraybuffer"===c.responseType&&c.response?a.text=c.response:"responseBody"in c?a.text=f(c.responseBody):a.text=c.responseText}}}),jQuery.ajaxPrefilter("dataview",function(a,b,c){jQuery.support.ajaxResponseType&&(a.hasOwnProperty("xhrFields")||(a.xhrFields={}),a.xhrFields.responseType="arraybuffer"),a.mimeType="text/plain; charset=x-user-defined"})}a.jDataView=(a.module||{}).exports=e,"undefined"!=typeof module&&(module.exports=e)}(this);
