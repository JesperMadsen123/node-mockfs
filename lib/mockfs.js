var fs = require('fs'),
    path = require('path'),
    wrap = require('./wrapfs.js'),
    util = require('util'),
    mountPoints = {};

wrap(fs, mountPoints);

var support = [ 'exists' ],
    nop = function() {};

function fill(proto, functions) {
   functions.forEach(function(f){
      proto['_' + f] = function() {
         var cb = arguments[arguments.length - 1];
         try {
            cb(null, this['_' + f + 'Sync'].apply(this, arguments));
         } catch(e) {
            cb(e);
         }
      };
   });
}

function getcb(args) {
   for(var i = args.length; i >= 0; i--) {
      if(typeof args[i] == 'function')
         return args[i];
   }
   return nop;
}

(function(){

   "use strict";

   function MockFS(spec) {
      this._mounted = false;
      this._path = null;
      this._spec = spec;
      this._options = {};
   }

   MockFS.prototype._lookup = function(p) {
      var root = this._spec, pathItem, specItem;

      if(typeof p != 'string')
         throw new TypeError("path must be a string");

      p = path.normalize(p).substr(this._path.length).split(path.sep);
      while(p.length) {
         pathItem = p.shift();
         if(root && root.items && pathItem in root.items) {
            root = root.items[pathItem]
         } else
            throw new Error('ENOENT');
      }
      return root;
   };

   MockFS.prototype._existsSync = function(path) {
      try {
         this._lookup(path);
         return true;
      } catch (e) {
         return false;
      }
   };

   MockFS.prototype._exists = function(path) {
      var cb = getcb(arguments);
      try {
         this._lookup(path);
         cb(true);
      } catch (e) {
         cb(false);
      }
   };

   /**
    * @param {String} path
    * @param {String} [encoding]
    * @param {Function} [callback]
    * @private
    */
   MockFS.prototype._readFile = function() {
      var cb = getcb(arguments);
      try {
         cb(null, this._readFileSync.apply(this, arguments));
      } catch (e) {
         cb(e);
      }
   };

   MockFS.prototype._readFileSync = function(path, encoding) {
      var f = this._lookup(path), buf;
      if(!this._isDirectory(f)) {
         buf = this._toBuffer(f);
         return encoding ? buf.toString(encoding) : buf;
      } else
         throw new Error('EISDIR');
   };

   MockFS.prototype._toBuffer = function(mockf) {
      var data = typeof mockf == 'object' && mockf.content || mockf;
      return Buffer.isBuffer(data) ? data : new Buffer(data);
   };

   MockFS.prototype._isDirectory = function(mocki) {
      return mocki && typeof mocki.items == 'object' && !('content' in mocki);
   };

   MockFS.prototype.mount = function(p, opts) {
      if(this._mounted) {
         throw new Error('EALREADYMOUNED');
      }
      p = path.join(p, path.sep);
      if(mountPoints[p]) {
         throw new Error("EINUSE");
      }
      mountPoints[p] = this;
      this._path = p;
      this._mounted = true;
      this._options = opts;
   };

   MockFS.prototype.umount = function() {
      if(this._mounted) {
         delete mountPoints[this._path];
         this._path = null;
         this._mounted = false;
      }
   };

   MockFS.prototype.getMountPoint = function() {
      return this._path;
   };

   MockFS.mount = function(spec, path) {
      var fs = new MockFS(spec);
      fs.mount(path);
      return fs;
   };

   //fill(MockFS.prototype, support);

   module.exports = MockFS;

})();