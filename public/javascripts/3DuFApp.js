(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Note:
 *
 * - Implementation must support adding new properties to `Uint8Array` instances.
 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *    incorrect length in some situations.
 *
 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
 * get the Object implementation, which is slower but will work correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = (function () {
  function Foo () {}
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    arr.constructor = Foo
    return arr.foo() === 42 && // typed array instances can be augmented
        arr.constructor === Foo && // constructor can be set
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  this.length = 0
  this.parent = undefined

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined' && object.buffer instanceof ArrayBuffer) {
    return fromTypedArray(that, object)
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-z\-]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []
  var i = 0

  for (; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (leadSurrogate) {
        // 2 leads in a row
        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          leadSurrogate = codePoint
          continue
        } else {
          // valid surrogate pair
          codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
          leadSurrogate = null
        }
      } else {
        // no lead yet

        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else {
          // valid lead
          leadSurrogate = codePoint
          continue
        }
      }
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
      leadSurrogate = null
    }

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x200000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

},{"base64-js":2,"ieee754":3,"is-array":4}],2:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],3:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],5:[function(require,module,exports){
'use strict';
// private property
var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";


// public method for encoding
exports.encode = function(input, utf8) {
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;

    while (i < input.length) {

        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        }
        else if (isNaN(chr3)) {
            enc4 = 64;
        }

        output = output + _keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4);

    }

    return output;
};

// public method for decoding
exports.decode = function(input, utf8) {
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;

    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    while (i < input.length) {

        enc1 = _keyStr.indexOf(input.charAt(i++));
        enc2 = _keyStr.indexOf(input.charAt(i++));
        enc3 = _keyStr.indexOf(input.charAt(i++));
        enc4 = _keyStr.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);

        if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
        }

    }

    return output;

};

},{}],6:[function(require,module,exports){
'use strict';
function CompressedObject() {
    this.compressedSize = 0;
    this.uncompressedSize = 0;
    this.crc32 = 0;
    this.compressionMethod = null;
    this.compressedContent = null;
}

CompressedObject.prototype = {
    /**
     * Return the decompressed content in an unspecified format.
     * The format will depend on the decompressor.
     * @return {Object} the decompressed content.
     */
    getContent: function() {
        return null; // see implementation
    },
    /**
     * Return the compressed content in an unspecified format.
     * The format will depend on the compressed conten source.
     * @return {Object} the compressed content.
     */
    getCompressedContent: function() {
        return null; // see implementation
    }
};
module.exports = CompressedObject;

},{}],7:[function(require,module,exports){
'use strict';
exports.STORE = {
    magic: "\x00\x00",
    compress: function(content, compressionOptions) {
        return content; // no compression
    },
    uncompress: function(content) {
        return content; // no compression
    },
    compressInputType: null,
    uncompressInputType: null
};
exports.DEFLATE = require('./flate');

},{"./flate":12}],8:[function(require,module,exports){
'use strict';

var utils = require('./utils');

var table = [
    0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA,
    0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3,
    0x0EDB8832, 0x79DCB8A4, 0xE0D5E91E, 0x97D2D988,
    0x09B64C2B, 0x7EB17CBD, 0xE7B82D07, 0x90BF1D91,
    0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE,
    0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7,
    0x136C9856, 0x646BA8C0, 0xFD62F97A, 0x8A65C9EC,
    0x14015C4F, 0x63066CD9, 0xFA0F3D63, 0x8D080DF5,
    0x3B6E20C8, 0x4C69105E, 0xD56041E4, 0xA2677172,
    0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B,
    0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940,
    0x32D86CE3, 0x45DF5C75, 0xDCD60DCF, 0xABD13D59,
    0x26D930AC, 0x51DE003A, 0xC8D75180, 0xBFD06116,
    0x21B4F4B5, 0x56B3C423, 0xCFBA9599, 0xB8BDA50F,
    0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924,
    0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D,
    0x76DC4190, 0x01DB7106, 0x98D220BC, 0xEFD5102A,
    0x71B18589, 0x06B6B51F, 0x9FBFE4A5, 0xE8B8D433,
    0x7807C9A2, 0x0F00F934, 0x9609A88E, 0xE10E9818,
    0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01,
    0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E,
    0x6C0695ED, 0x1B01A57B, 0x8208F4C1, 0xF50FC457,
    0x65B0D9C6, 0x12B7E950, 0x8BBEB8EA, 0xFCB9887C,
    0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3, 0xFBD44C65,
    0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2,
    0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB,
    0x4369E96A, 0x346ED9FC, 0xAD678846, 0xDA60B8D0,
    0x44042D73, 0x33031DE5, 0xAA0A4C5F, 0xDD0D7CC9,
    0x5005713C, 0x270241AA, 0xBE0B1010, 0xC90C2086,
    0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F,
    0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4,
    0x59B33D17, 0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD,
    0xEDB88320, 0x9ABFB3B6, 0x03B6E20C, 0x74B1D29A,
    0xEAD54739, 0x9DD277AF, 0x04DB2615, 0x73DC1683,
    0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8,
    0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1,
    0xF00F9344, 0x8708A3D2, 0x1E01F268, 0x6906C2FE,
    0xF762575D, 0x806567CB, 0x196C3671, 0x6E6B06E7,
    0xFED41B76, 0x89D32BE0, 0x10DA7A5A, 0x67DD4ACC,
    0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5,
    0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252,
    0xD1BB67F1, 0xA6BC5767, 0x3FB506DD, 0x48B2364B,
    0xD80D2BDA, 0xAF0A1B4C, 0x36034AF6, 0x41047A60,
    0xDF60EFC3, 0xA867DF55, 0x316E8EEF, 0x4669BE79,
    0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236,
    0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F,
    0xC5BA3BBE, 0xB2BD0B28, 0x2BB45A92, 0x5CB36A04,
    0xC2D7FFA7, 0xB5D0CF31, 0x2CD99E8B, 0x5BDEAE1D,
    0x9B64C2B0, 0xEC63F226, 0x756AA39C, 0x026D930A,
    0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713,
    0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38,
    0x92D28E9B, 0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21,
    0x86D3D2D4, 0xF1D4E242, 0x68DDB3F8, 0x1FDA836E,
    0x81BE16CD, 0xF6B9265B, 0x6FB077E1, 0x18B74777,
    0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C,
    0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45,
    0xA00AE278, 0xD70DD2EE, 0x4E048354, 0x3903B3C2,
    0xA7672661, 0xD06016F7, 0x4969474D, 0x3E6E77DB,
    0xAED16A4A, 0xD9D65ADC, 0x40DF0B66, 0x37D83BF0,
    0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9,
    0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6,
    0xBAD03605, 0xCDD70693, 0x54DE5729, 0x23D967BF,
    0xB3667A2E, 0xC4614AB8, 0x5D681B02, 0x2A6F2B94,
    0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B, 0x2D02EF8D
];

/**
 *
 *  Javascript crc32
 *  http://www.webtoolkit.info/
 *
 */
module.exports = function crc32(input, crc) {
    if (typeof input === "undefined" || !input.length) {
        return 0;
    }

    var isArray = utils.getTypeOf(input) !== "string";

    if (typeof(crc) == "undefined") {
        crc = 0;
    }
    var x = 0;
    var y = 0;
    var b = 0;

    crc = crc ^ (-1);
    for (var i = 0, iTop = input.length; i < iTop; i++) {
        b = isArray ? input[i] : input.charCodeAt(i);
        y = (crc ^ b) & 0xFF;
        x = table[y];
        crc = (crc >>> 8) ^ x;
    }

    return crc ^ (-1);
};
// vim: set shiftwidth=4 softtabstop=4:

},{"./utils":25}],9:[function(require,module,exports){
'use strict';
var utils = require('./utils');

function DataReader(data) {
    this.data = null; // type : see implementation
    this.length = 0;
    this.index = 0;
}
DataReader.prototype = {
    /**
     * Check that the offset will not go too far.
     * @param {string} offset the additional offset to check.
     * @throws {Error} an Error if the offset is out of bounds.
     */
    checkOffset: function(offset) {
        this.checkIndex(this.index + offset);
    },
    /**
     * Check that the specifed index will not be too far.
     * @param {string} newIndex the index to check.
     * @throws {Error} an Error if the index is out of bounds.
     */
    checkIndex: function(newIndex) {
        if (this.length < newIndex || newIndex < 0) {
            throw new Error("End of data reached (data length = " + this.length + ", asked index = " + (newIndex) + "). Corrupted zip ?");
        }
    },
    /**
     * Change the index.
     * @param {number} newIndex The new index.
     * @throws {Error} if the new index is out of the data.
     */
    setIndex: function(newIndex) {
        this.checkIndex(newIndex);
        this.index = newIndex;
    },
    /**
     * Skip the next n bytes.
     * @param {number} n the number of bytes to skip.
     * @throws {Error} if the new index is out of the data.
     */
    skip: function(n) {
        this.setIndex(this.index + n);
    },
    /**
     * Get the byte at the specified index.
     * @param {number} i the index to use.
     * @return {number} a byte.
     */
    byteAt: function(i) {
        // see implementations
    },
    /**
     * Get the next number with a given byte size.
     * @param {number} size the number of bytes to read.
     * @return {number} the corresponding number.
     */
    readInt: function(size) {
        var result = 0,
            i;
        this.checkOffset(size);
        for (i = this.index + size - 1; i >= this.index; i--) {
            result = (result << 8) + this.byteAt(i);
        }
        this.index += size;
        return result;
    },
    /**
     * Get the next string with a given byte size.
     * @param {number} size the number of bytes to read.
     * @return {string} the corresponding string.
     */
    readString: function(size) {
        return utils.transformTo("string", this.readData(size));
    },
    /**
     * Get raw data without conversion, <size> bytes.
     * @param {number} size the number of bytes to read.
     * @return {Object} the raw data, implementation specific.
     */
    readData: function(size) {
        // see implementations
    },
    /**
     * Find the last occurence of a zip signature (4 bytes).
     * @param {string} sig the signature to find.
     * @return {number} the index of the last occurence, -1 if not found.
     */
    lastIndexOfSignature: function(sig) {
        // see implementations
    },
    /**
     * Get the next date.
     * @return {Date} the date.
     */
    readDate: function() {
        var dostime = this.readInt(4);
        return new Date(
        ((dostime >> 25) & 0x7f) + 1980, // year
        ((dostime >> 21) & 0x0f) - 1, // month
        (dostime >> 16) & 0x1f, // day
        (dostime >> 11) & 0x1f, // hour
        (dostime >> 5) & 0x3f, // minute
        (dostime & 0x1f) << 1); // second
    }
};
module.exports = DataReader;

},{"./utils":25}],10:[function(require,module,exports){
'use strict';
exports.base64 = false;
exports.binary = false;
exports.dir = false;
exports.createFolders = false;
exports.date = null;
exports.compression = null;
exports.compressionOptions = null;
exports.comment = null;
exports.unixPermissions = null;
exports.dosPermissions = null;

},{}],11:[function(require,module,exports){
'use strict';
var utils = require('./utils');

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.string2binary = function(str) {
    return utils.string2binary(str);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.string2Uint8Array = function(str) {
    return utils.transformTo("uint8array", str);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.uint8Array2String = function(array) {
    return utils.transformTo("string", array);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.string2Blob = function(str) {
    var buffer = utils.transformTo("arraybuffer", str);
    return utils.arrayBuffer2Blob(buffer);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.arrayBuffer2Blob = function(buffer) {
    return utils.arrayBuffer2Blob(buffer);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.transformTo = function(outputType, input) {
    return utils.transformTo(outputType, input);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.getTypeOf = function(input) {
    return utils.getTypeOf(input);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.checkSupport = function(type) {
    return utils.checkSupport(type);
};

/**
 * @deprecated
 * This value will be removed in a future version without replacement.
 */
exports.MAX_VALUE_16BITS = utils.MAX_VALUE_16BITS;

/**
 * @deprecated
 * This value will be removed in a future version without replacement.
 */
exports.MAX_VALUE_32BITS = utils.MAX_VALUE_32BITS;


/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.pretty = function(str) {
    return utils.pretty(str);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.findCompression = function(compressionMethod) {
    return utils.findCompression(compressionMethod);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.isRegExp = function (object) {
    return utils.isRegExp(object);
};


},{"./utils":25}],12:[function(require,module,exports){
'use strict';
var USE_TYPEDARRAY = (typeof Uint8Array !== 'undefined') && (typeof Uint16Array !== 'undefined') && (typeof Uint32Array !== 'undefined');

var pako = require("pako");
exports.uncompressInputType = USE_TYPEDARRAY ? "uint8array" : "array";
exports.compressInputType = USE_TYPEDARRAY ? "uint8array" : "array";

exports.magic = "\x08\x00";
exports.compress = function(input, compressionOptions) {
    return pako.deflateRaw(input, {
        level : compressionOptions.level || -1 // default compression
    });
};
exports.uncompress =  function(input) {
    return pako.inflateRaw(input);
};

},{"pako":28}],13:[function(require,module,exports){
'use strict';

var base64 = require('./base64');

/**
Usage:
   zip = new JSZip();
   zip.file("hello.txt", "Hello, World!").file("tempfile", "nothing");
   zip.folder("images").file("smile.gif", base64Data, {base64: true});
   zip.file("Xmas.txt", "Ho ho ho !", {date : new Date("December 25, 2007 00:00:01")});
   zip.remove("tempfile");

   base64zip = zip.generate();

**/

/**
 * Representation a of zip file in js
 * @constructor
 * @param {String=|ArrayBuffer=|Uint8Array=} data the data to load, if any (optional).
 * @param {Object=} options the options for creating this objects (optional).
 */
function JSZip(data, options) {
    // if this constructor is used without `new`, it adds `new` before itself:
    if(!(this instanceof JSZip)) return new JSZip(data, options);

    // object containing the files :
    // {
    //   "folder/" : {...},
    //   "folder/data.txt" : {...}
    // }
    this.files = {};

    this.comment = null;

    // Where we are in the hierarchy
    this.root = "";
    if (data) {
        this.load(data, options);
    }
    this.clone = function() {
        var newObj = new JSZip();
        for (var i in this) {
            if (typeof this[i] !== "function") {
                newObj[i] = this[i];
            }
        }
        return newObj;
    };
}
JSZip.prototype = require('./object');
JSZip.prototype.load = require('./load');
JSZip.support = require('./support');
JSZip.defaults = require('./defaults');

/**
 * @deprecated
 * This namespace will be removed in a future version without replacement.
 */
JSZip.utils = require('./deprecatedPublicUtils');

JSZip.base64 = {
    /**
     * @deprecated
     * This method will be removed in a future version without replacement.
     */
    encode : function(input) {
        return base64.encode(input);
    },
    /**
     * @deprecated
     * This method will be removed in a future version without replacement.
     */
    decode : function(input) {
        return base64.decode(input);
    }
};
JSZip.compressions = require('./compressions');
module.exports = JSZip;

},{"./base64":5,"./compressions":7,"./defaults":10,"./deprecatedPublicUtils":11,"./load":14,"./object":17,"./support":21}],14:[function(require,module,exports){
'use strict';
var base64 = require('./base64');
var ZipEntries = require('./zipEntries');
module.exports = function(data, options) {
    var files, zipEntries, i, input;
    options = options || {};
    if (options.base64) {
        data = base64.decode(data);
    }

    zipEntries = new ZipEntries(data, options);
    files = zipEntries.files;
    for (i = 0; i < files.length; i++) {
        input = files[i];
        this.file(input.fileName, input.decompressed, {
            binary: true,
            optimizedBinaryString: true,
            date: input.date,
            dir: input.dir,
            comment : input.fileComment.length ? input.fileComment : null,
            unixPermissions : input.unixPermissions,
            dosPermissions : input.dosPermissions,
            createFolders: options.createFolders
        });
    }
    if (zipEntries.zipComment.length) {
        this.comment = zipEntries.zipComment;
    }

    return this;
};

},{"./base64":5,"./zipEntries":26}],15:[function(require,module,exports){
(function (Buffer){
'use strict';
module.exports = function(data, encoding){
    return new Buffer(data, encoding);
};
module.exports.test = function(b){
    return Buffer.isBuffer(b);
};

}).call(this,require("buffer").Buffer)
},{"buffer":1}],16:[function(require,module,exports){
'use strict';
var Uint8ArrayReader = require('./uint8ArrayReader');

function NodeBufferReader(data) {
    this.data = data;
    this.length = this.data.length;
    this.index = 0;
}
NodeBufferReader.prototype = new Uint8ArrayReader();

/**
 * @see DataReader.readData
 */
NodeBufferReader.prototype.readData = function(size) {
    this.checkOffset(size);
    var result = this.data.slice(this.index, this.index + size);
    this.index += size;
    return result;
};
module.exports = NodeBufferReader;

},{"./uint8ArrayReader":22}],17:[function(require,module,exports){
'use strict';
var support = require('./support');
var utils = require('./utils');
var crc32 = require('./crc32');
var signature = require('./signature');
var defaults = require('./defaults');
var base64 = require('./base64');
var compressions = require('./compressions');
var CompressedObject = require('./compressedObject');
var nodeBuffer = require('./nodeBuffer');
var utf8 = require('./utf8');
var StringWriter = require('./stringWriter');
var Uint8ArrayWriter = require('./uint8ArrayWriter');

/**
 * Returns the raw data of a ZipObject, decompress the content if necessary.
 * @param {ZipObject} file the file to use.
 * @return {String|ArrayBuffer|Uint8Array|Buffer} the data.
 */
var getRawData = function(file) {
    if (file._data instanceof CompressedObject) {
        file._data = file._data.getContent();
        file.options.binary = true;
        file.options.base64 = false;

        if (utils.getTypeOf(file._data) === "uint8array") {
            var copy = file._data;
            // when reading an arraybuffer, the CompressedObject mechanism will keep it and subarray() a Uint8Array.
            // if we request a file in the same format, we might get the same Uint8Array or its ArrayBuffer (the original zip file).
            file._data = new Uint8Array(copy.length);
            // with an empty Uint8Array, Opera fails with a "Offset larger than array size"
            if (copy.length !== 0) {
                file._data.set(copy, 0);
            }
        }
    }
    return file._data;
};

/**
 * Returns the data of a ZipObject in a binary form. If the content is an unicode string, encode it.
 * @param {ZipObject} file the file to use.
 * @return {String|ArrayBuffer|Uint8Array|Buffer} the data.
 */
var getBinaryData = function(file) {
    var result = getRawData(file),
        type = utils.getTypeOf(result);
    if (type === "string") {
        if (!file.options.binary) {
            // unicode text !
            // unicode string => binary string is a painful process, check if we can avoid it.
            if (support.nodebuffer) {
                return nodeBuffer(result, "utf-8");
            }
        }
        return file.asBinary();
    }
    return result;
};

/**
 * Transform this._data into a string.
 * @param {function} filter a function String -> String, applied if not null on the result.
 * @return {String} the string representing this._data.
 */
var dataToString = function(asUTF8) {
    var result = getRawData(this);
    if (result === null || typeof result === "undefined") {
        return "";
    }
    // if the data is a base64 string, we decode it before checking the encoding !
    if (this.options.base64) {
        result = base64.decode(result);
    }
    if (asUTF8 && this.options.binary) {
        // JSZip.prototype.utf8decode supports arrays as input
        // skip to array => string step, utf8decode will do it.
        result = out.utf8decode(result);
    }
    else {
        // no utf8 transformation, do the array => string step.
        result = utils.transformTo("string", result);
    }

    if (!asUTF8 && !this.options.binary) {
        result = utils.transformTo("string", out.utf8encode(result));
    }
    return result;
};
/**
 * A simple object representing a file in the zip file.
 * @constructor
 * @param {string} name the name of the file
 * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data
 * @param {Object} options the options of the file
 */
var ZipObject = function(name, data, options) {
    this.name = name;
    this.dir = options.dir;
    this.date = options.date;
    this.comment = options.comment;
    this.unixPermissions = options.unixPermissions;
    this.dosPermissions = options.dosPermissions;

    this._data = data;
    this.options = options;

    /*
     * This object contains initial values for dir and date.
     * With them, we can check if the user changed the deprecated metadata in
     * `ZipObject#options` or not.
     */
    this._initialMetadata = {
      dir : options.dir,
      date : options.date
    };
};

ZipObject.prototype = {
    /**
     * Return the content as UTF8 string.
     * @return {string} the UTF8 string.
     */
    asText: function() {
        return dataToString.call(this, true);
    },
    /**
     * Returns the binary content.
     * @return {string} the content as binary.
     */
    asBinary: function() {
        return dataToString.call(this, false);
    },
    /**
     * Returns the content as a nodejs Buffer.
     * @return {Buffer} the content as a Buffer.
     */
    asNodeBuffer: function() {
        var result = getBinaryData(this);
        return utils.transformTo("nodebuffer", result);
    },
    /**
     * Returns the content as an Uint8Array.
     * @return {Uint8Array} the content as an Uint8Array.
     */
    asUint8Array: function() {
        var result = getBinaryData(this);
        return utils.transformTo("uint8array", result);
    },
    /**
     * Returns the content as an ArrayBuffer.
     * @return {ArrayBuffer} the content as an ArrayBufer.
     */
    asArrayBuffer: function() {
        return this.asUint8Array().buffer;
    }
};

/**
 * Transform an integer into a string in hexadecimal.
 * @private
 * @param {number} dec the number to convert.
 * @param {number} bytes the number of bytes to generate.
 * @returns {string} the result.
 */
var decToHex = function(dec, bytes) {
    var hex = "",
        i;
    for (i = 0; i < bytes; i++) {
        hex += String.fromCharCode(dec & 0xff);
        dec = dec >>> 8;
    }
    return hex;
};

/**
 * Merge the objects passed as parameters into a new one.
 * @private
 * @param {...Object} var_args All objects to merge.
 * @return {Object} a new object with the data of the others.
 */
var extend = function() {
    var result = {}, i, attr;
    for (i = 0; i < arguments.length; i++) { // arguments is not enumerable in some browsers
        for (attr in arguments[i]) {
            if (arguments[i].hasOwnProperty(attr) && typeof result[attr] === "undefined") {
                result[attr] = arguments[i][attr];
            }
        }
    }
    return result;
};

/**
 * Transforms the (incomplete) options from the user into the complete
 * set of options to create a file.
 * @private
 * @param {Object} o the options from the user.
 * @return {Object} the complete set of options.
 */
var prepareFileAttrs = function(o) {
    o = o || {};
    if (o.base64 === true && (o.binary === null || o.binary === undefined)) {
        o.binary = true;
    }
    o = extend(o, defaults);
    o.date = o.date || new Date();
    if (o.compression !== null) o.compression = o.compression.toUpperCase();

    return o;
};

/**
 * Add a file in the current folder.
 * @private
 * @param {string} name the name of the file
 * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data of the file
 * @param {Object} o the options of the file
 * @return {Object} the new file.
 */
var fileAdd = function(name, data, o) {
    // be sure sub folders exist
    var dataType = utils.getTypeOf(data),
        parent;

    o = prepareFileAttrs(o);

    if (typeof o.unixPermissions === "string") {
        o.unixPermissions = parseInt(o.unixPermissions, 8);
    }

    // UNX_IFDIR  0040000 see zipinfo.c
    if (o.unixPermissions && (o.unixPermissions & 0x4000)) {
        o.dir = true;
    }
    // Bit 4    Directory
    if (o.dosPermissions && (o.dosPermissions & 0x0010)) {
        o.dir = true;
    }

    if (o.dir) {
        name = forceTrailingSlash(name);
    }

    if (o.createFolders && (parent = parentFolder(name))) {
        folderAdd.call(this, parent, true);
    }

    if (o.dir || data === null || typeof data === "undefined") {
        o.base64 = false;
        o.binary = false;
        data = null;
        dataType = null;
    }
    else if (dataType === "string") {
        if (o.binary && !o.base64) {
            // optimizedBinaryString == true means that the file has already been filtered with a 0xFF mask
            if (o.optimizedBinaryString !== true) {
                // this is a string, not in a base64 format.
                // Be sure that this is a correct "binary string"
                data = utils.string2binary(data);
            }
        }
    }
    else { // arraybuffer, uint8array, ...
        o.base64 = false;
        o.binary = true;

        if (!dataType && !(data instanceof CompressedObject)) {
            throw new Error("The data of '" + name + "' is in an unsupported format !");
        }

        // special case : it's way easier to work with Uint8Array than with ArrayBuffer
        if (dataType === "arraybuffer") {
            data = utils.transformTo("uint8array", data);
        }
    }

    var object = new ZipObject(name, data, o);
    this.files[name] = object;
    return object;
};

/**
 * Find the parent folder of the path.
 * @private
 * @param {string} path the path to use
 * @return {string} the parent folder, or ""
 */
var parentFolder = function (path) {
    if (path.slice(-1) == '/') {
        path = path.substring(0, path.length - 1);
    }
    var lastSlash = path.lastIndexOf('/');
    return (lastSlash > 0) ? path.substring(0, lastSlash) : "";
};


/**
 * Returns the path with a slash at the end.
 * @private
 * @param {String} path the path to check.
 * @return {String} the path with a trailing slash.
 */
var forceTrailingSlash = function(path) {
    // Check the name ends with a /
    if (path.slice(-1) != "/") {
        path += "/"; // IE doesn't like substr(-1)
    }
    return path;
};
/**
 * Add a (sub) folder in the current folder.
 * @private
 * @param {string} name the folder's name
 * @param {boolean=} [createFolders] If true, automatically create sub
 *  folders. Defaults to false.
 * @return {Object} the new folder.
 */
var folderAdd = function(name, createFolders) {
    createFolders = (typeof createFolders !== 'undefined') ? createFolders : false;

    name = forceTrailingSlash(name);

    // Does this folder already exist?
    if (!this.files[name]) {
        fileAdd.call(this, name, null, {
            dir: true,
            createFolders: createFolders
        });
    }
    return this.files[name];
};

/**
 * Generate a JSZip.CompressedObject for a given zipOject.
 * @param {ZipObject} file the object to read.
 * @param {JSZip.compression} compression the compression to use.
 * @param {Object} compressionOptions the options to use when compressing.
 * @return {JSZip.CompressedObject} the compressed result.
 */
var generateCompressedObjectFrom = function(file, compression, compressionOptions) {
    var result = new CompressedObject(),
        content;

    // the data has not been decompressed, we might reuse things !
    if (file._data instanceof CompressedObject) {
        result.uncompressedSize = file._data.uncompressedSize;
        result.crc32 = file._data.crc32;

        if (result.uncompressedSize === 0 || file.dir) {
            compression = compressions['STORE'];
            result.compressedContent = "";
            result.crc32 = 0;
        }
        else if (file._data.compressionMethod === compression.magic) {
            result.compressedContent = file._data.getCompressedContent();
        }
        else {
            content = file._data.getContent();
            // need to decompress / recompress
            result.compressedContent = compression.compress(utils.transformTo(compression.compressInputType, content), compressionOptions);
        }
    }
    else {
        // have uncompressed data
        content = getBinaryData(file);
        if (!content || content.length === 0 || file.dir) {
            compression = compressions['STORE'];
            content = "";
        }
        result.uncompressedSize = content.length;
        result.crc32 = crc32(content);
        result.compressedContent = compression.compress(utils.transformTo(compression.compressInputType, content), compressionOptions);
    }

    result.compressedSize = result.compressedContent.length;
    result.compressionMethod = compression.magic;

    return result;
};




/**
 * Generate the UNIX part of the external file attributes.
 * @param {Object} unixPermissions the unix permissions or null.
 * @param {Boolean} isDir true if the entry is a directory, false otherwise.
 * @return {Number} a 32 bit integer.
 *
 * adapted from http://unix.stackexchange.com/questions/14705/the-zip-formats-external-file-attribute :
 *
 * TTTTsstrwxrwxrwx0000000000ADVSHR
 * ^^^^____________________________ file type, see zipinfo.c (UNX_*)
 *     ^^^_________________________ setuid, setgid, sticky
 *        ^^^^^^^^^________________ permissions
 *                 ^^^^^^^^^^______ not used ?
 *                           ^^^^^^ DOS attribute bits : Archive, Directory, Volume label, System file, Hidden, Read only
 */
var generateUnixExternalFileAttr = function (unixPermissions, isDir) {

    var result = unixPermissions;
    if (!unixPermissions) {
        // I can't use octal values in strict mode, hence the hexa.
        //  040775 => 0x41fd
        // 0100664 => 0x81b4
        result = isDir ? 0x41fd : 0x81b4;
    }

    return (result & 0xFFFF) << 16;
};

/**
 * Generate the DOS part of the external file attributes.
 * @param {Object} dosPermissions the dos permissions or null.
 * @param {Boolean} isDir true if the entry is a directory, false otherwise.
 * @return {Number} a 32 bit integer.
 *
 * Bit 0     Read-Only
 * Bit 1     Hidden
 * Bit 2     System
 * Bit 3     Volume Label
 * Bit 4     Directory
 * Bit 5     Archive
 */
var generateDosExternalFileAttr = function (dosPermissions, isDir) {

    // the dir flag is already set for compatibility

    return (dosPermissions || 0)  & 0x3F;
};

/**
 * Generate the various parts used in the construction of the final zip file.
 * @param {string} name the file name.
 * @param {ZipObject} file the file content.
 * @param {JSZip.CompressedObject} compressedObject the compressed object.
 * @param {number} offset the current offset from the start of the zip file.
 * @param {String} platform let's pretend we are this platform (change platform dependents fields)
 * @return {object} the zip parts.
 */
var generateZipParts = function(name, file, compressedObject, offset, platform) {
    var data = compressedObject.compressedContent,
        utfEncodedFileName = utils.transformTo("string", utf8.utf8encode(file.name)),
        comment = file.comment || "",
        utfEncodedComment = utils.transformTo("string", utf8.utf8encode(comment)),
        useUTF8ForFileName = utfEncodedFileName.length !== file.name.length,
        useUTF8ForComment = utfEncodedComment.length !== comment.length,
        o = file.options,
        dosTime,
        dosDate,
        extraFields = "",
        unicodePathExtraField = "",
        unicodeCommentExtraField = "",
        dir, date;


    // handle the deprecated options.dir
    if (file._initialMetadata.dir !== file.dir) {
        dir = file.dir;
    } else {
        dir = o.dir;
    }

    // handle the deprecated options.date
    if(file._initialMetadata.date !== file.date) {
        date = file.date;
    } else {
        date = o.date;
    }

    var extFileAttr = 0;
    var versionMadeBy = 0;
    if (dir) {
        // dos or unix, we set the dos dir flag
        extFileAttr |= 0x00010;
    }
    if(platform === "UNIX") {
        versionMadeBy = 0x031E; // UNIX, version 3.0
        extFileAttr |= generateUnixExternalFileAttr(file.unixPermissions, dir);
    } else { // DOS or other, fallback to DOS
        versionMadeBy = 0x0014; // DOS, version 2.0
        extFileAttr |= generateDosExternalFileAttr(file.dosPermissions, dir);
    }

    // date
    // @see http://www.delorie.com/djgpp/doc/rbinter/it/52/13.html
    // @see http://www.delorie.com/djgpp/doc/rbinter/it/65/16.html
    // @see http://www.delorie.com/djgpp/doc/rbinter/it/66/16.html

    dosTime = date.getHours();
    dosTime = dosTime << 6;
    dosTime = dosTime | date.getMinutes();
    dosTime = dosTime << 5;
    dosTime = dosTime | date.getSeconds() / 2;

    dosDate = date.getFullYear() - 1980;
    dosDate = dosDate << 4;
    dosDate = dosDate | (date.getMonth() + 1);
    dosDate = dosDate << 5;
    dosDate = dosDate | date.getDate();

    if (useUTF8ForFileName) {
        // set the unicode path extra field. unzip needs at least one extra
        // field to correctly handle unicode path, so using the path is as good
        // as any other information. This could improve the situation with
        // other archive managers too.
        // This field is usually used without the utf8 flag, with a non
        // unicode path in the header (winrar, winzip). This helps (a bit)
        // with the messy Windows' default compressed folders feature but
        // breaks on p7zip which doesn't seek the unicode path extra field.
        // So for now, UTF-8 everywhere !
        unicodePathExtraField =
            // Version
            decToHex(1, 1) +
            // NameCRC32
            decToHex(crc32(utfEncodedFileName), 4) +
            // UnicodeName
            utfEncodedFileName;

        extraFields +=
            // Info-ZIP Unicode Path Extra Field
            "\x75\x70" +
            // size
            decToHex(unicodePathExtraField.length, 2) +
            // content
            unicodePathExtraField;
    }

    if(useUTF8ForComment) {

        unicodeCommentExtraField =
            // Version
            decToHex(1, 1) +
            // CommentCRC32
            decToHex(this.crc32(utfEncodedComment), 4) +
            // UnicodeName
            utfEncodedComment;

        extraFields +=
            // Info-ZIP Unicode Path Extra Field
            "\x75\x63" +
            // size
            decToHex(unicodeCommentExtraField.length, 2) +
            // content
            unicodeCommentExtraField;
    }

    var header = "";

    // version needed to extract
    header += "\x0A\x00";
    // general purpose bit flag
    // set bit 11 if utf8
    header += (useUTF8ForFileName || useUTF8ForComment) ? "\x00\x08" : "\x00\x00";
    // compression method
    header += compressedObject.compressionMethod;
    // last mod file time
    header += decToHex(dosTime, 2);
    // last mod file date
    header += decToHex(dosDate, 2);
    // crc-32
    header += decToHex(compressedObject.crc32, 4);
    // compressed size
    header += decToHex(compressedObject.compressedSize, 4);
    // uncompressed size
    header += decToHex(compressedObject.uncompressedSize, 4);
    // file name length
    header += decToHex(utfEncodedFileName.length, 2);
    // extra field length
    header += decToHex(extraFields.length, 2);


    var fileRecord = signature.LOCAL_FILE_HEADER + header + utfEncodedFileName + extraFields;

    var dirRecord = signature.CENTRAL_FILE_HEADER +
    // version made by (00: DOS)
    decToHex(versionMadeBy, 2) +
    // file header (common to file and central directory)
    header +
    // file comment length
    decToHex(utfEncodedComment.length, 2) +
    // disk number start
    "\x00\x00" +
    // internal file attributes TODO
    "\x00\x00" +
    // external file attributes
    decToHex(extFileAttr, 4) +
    // relative offset of local header
    decToHex(offset, 4) +
    // file name
    utfEncodedFileName +
    // extra field
    extraFields +
    // file comment
    utfEncodedComment;

    return {
        fileRecord: fileRecord,
        dirRecord: dirRecord,
        compressedObject: compressedObject
    };
};


// return the actual prototype of JSZip
var out = {
    /**
     * Read an existing zip and merge the data in the current JSZip object.
     * The implementation is in jszip-load.js, don't forget to include it.
     * @param {String|ArrayBuffer|Uint8Array|Buffer} stream  The stream to load
     * @param {Object} options Options for loading the stream.
     *  options.base64 : is the stream in base64 ? default : false
     * @return {JSZip} the current JSZip object
     */
    load: function(stream, options) {
        throw new Error("Load method is not defined. Is the file jszip-load.js included ?");
    },

    /**
     * Filter nested files/folders with the specified function.
     * @param {Function} search the predicate to use :
     * function (relativePath, file) {...}
     * It takes 2 arguments : the relative path and the file.
     * @return {Array} An array of matching elements.
     */
    filter: function(search) {
        var result = [],
            filename, relativePath, file, fileClone;
        for (filename in this.files) {
            if (!this.files.hasOwnProperty(filename)) {
                continue;
            }
            file = this.files[filename];
            // return a new object, don't let the user mess with our internal objects :)
            fileClone = new ZipObject(file.name, file._data, extend(file.options));
            relativePath = filename.slice(this.root.length, filename.length);
            if (filename.slice(0, this.root.length) === this.root && // the file is in the current root
            search(relativePath, fileClone)) { // and the file matches the function
                result.push(fileClone);
            }
        }
        return result;
    },

    /**
     * Add a file to the zip file, or search a file.
     * @param   {string|RegExp} name The name of the file to add (if data is defined),
     * the name of the file to find (if no data) or a regex to match files.
     * @param   {String|ArrayBuffer|Uint8Array|Buffer} data  The file data, either raw or base64 encoded
     * @param   {Object} o     File options
     * @return  {JSZip|Object|Array} this JSZip object (when adding a file),
     * a file (when searching by string) or an array of files (when searching by regex).
     */
    file: function(name, data, o) {
        if (arguments.length === 1) {
            if (utils.isRegExp(name)) {
                var regexp = name;
                return this.filter(function(relativePath, file) {
                    return !file.dir && regexp.test(relativePath);
                });
            }
            else { // text
                return this.filter(function(relativePath, file) {
                    return !file.dir && relativePath === name;
                })[0] || null;
            }
        }
        else { // more than one argument : we have data !
            name = this.root + name;
            fileAdd.call(this, name, data, o);
        }
        return this;
    },

    /**
     * Add a directory to the zip file, or search.
     * @param   {String|RegExp} arg The name of the directory to add, or a regex to search folders.
     * @return  {JSZip} an object with the new directory as the root, or an array containing matching folders.
     */
    folder: function(arg) {
        if (!arg) {
            return this;
        }

        if (utils.isRegExp(arg)) {
            return this.filter(function(relativePath, file) {
                return file.dir && arg.test(relativePath);
            });
        }

        // else, name is a new folder
        var name = this.root + arg;
        var newFolder = folderAdd.call(this, name);

        // Allow chaining by returning a new object with this folder as the root
        var ret = this.clone();
        ret.root = newFolder.name;
        return ret;
    },

    /**
     * Delete a file, or a directory and all sub-files, from the zip
     * @param {string} name the name of the file to delete
     * @return {JSZip} this JSZip object
     */
    remove: function(name) {
        name = this.root + name;
        var file = this.files[name];
        if (!file) {
            // Look for any folders
            if (name.slice(-1) != "/") {
                name += "/";
            }
            file = this.files[name];
        }

        if (file && !file.dir) {
            // file
            delete this.files[name];
        } else {
            // maybe a folder, delete recursively
            var kids = this.filter(function(relativePath, file) {
                return file.name.slice(0, name.length) === name;
            });
            for (var i = 0; i < kids.length; i++) {
                delete this.files[kids[i].name];
            }
        }

        return this;
    },

    /**
     * Generate the complete zip file
     * @param {Object} options the options to generate the zip file :
     * - base64, (deprecated, use type instead) true to generate base64.
     * - compression, "STORE" by default.
     * - type, "base64" by default. Values are : string, base64, uint8array, arraybuffer, blob.
     * @return {String|Uint8Array|ArrayBuffer|Buffer|Blob} the zip file
     */
    generate: function(options) {
        options = extend(options || {}, {
            base64: true,
            compression: "STORE",
            compressionOptions : null,
            type: "base64",
            platform: "DOS",
            comment: null,
            mimeType: 'application/zip'
        });

        utils.checkSupport(options.type);

        // accept nodejs `process.platform`
        if(
          options.platform === 'darwin' ||
          options.platform === 'freebsd' ||
          options.platform === 'linux' ||
          options.platform === 'sunos'
        ) {
          options.platform = "UNIX";
        }
        if (options.platform === 'win32') {
          options.platform = "DOS";
        }

        var zipData = [],
            localDirLength = 0,
            centralDirLength = 0,
            writer, i,
            utfEncodedComment = utils.transformTo("string", this.utf8encode(options.comment || this.comment || ""));

        // first, generate all the zip parts.
        for (var name in this.files) {
            if (!this.files.hasOwnProperty(name)) {
                continue;
            }
            var file = this.files[name];

            var compressionName = file.options.compression || options.compression.toUpperCase();
            var compression = compressions[compressionName];
            if (!compression) {
                throw new Error(compressionName + " is not a valid compression method !");
            }
            var compressionOptions = file.options.compressionOptions || options.compressionOptions || {};

            var compressedObject = generateCompressedObjectFrom.call(this, file, compression, compressionOptions);

            var zipPart = generateZipParts.call(this, name, file, compressedObject, localDirLength, options.platform);
            localDirLength += zipPart.fileRecord.length + compressedObject.compressedSize;
            centralDirLength += zipPart.dirRecord.length;
            zipData.push(zipPart);
        }

        var dirEnd = "";

        // end of central dir signature
        dirEnd = signature.CENTRAL_DIRECTORY_END +
        // number of this disk
        "\x00\x00" +
        // number of the disk with the start of the central directory
        "\x00\x00" +
        // total number of entries in the central directory on this disk
        decToHex(zipData.length, 2) +
        // total number of entries in the central directory
        decToHex(zipData.length, 2) +
        // size of the central directory   4 bytes
        decToHex(centralDirLength, 4) +
        // offset of start of central directory with respect to the starting disk number
        decToHex(localDirLength, 4) +
        // .ZIP file comment length
        decToHex(utfEncodedComment.length, 2) +
        // .ZIP file comment
        utfEncodedComment;


        // we have all the parts (and the total length)
        // time to create a writer !
        var typeName = options.type.toLowerCase();
        if(typeName==="uint8array"||typeName==="arraybuffer"||typeName==="blob"||typeName==="nodebuffer") {
            writer = new Uint8ArrayWriter(localDirLength + centralDirLength + dirEnd.length);
        }else{
            writer = new StringWriter(localDirLength + centralDirLength + dirEnd.length);
        }

        for (i = 0; i < zipData.length; i++) {
            writer.append(zipData[i].fileRecord);
            writer.append(zipData[i].compressedObject.compressedContent);
        }
        for (i = 0; i < zipData.length; i++) {
            writer.append(zipData[i].dirRecord);
        }

        writer.append(dirEnd);

        var zip = writer.finalize();



        switch(options.type.toLowerCase()) {
            // case "zip is an Uint8Array"
            case "uint8array" :
            case "arraybuffer" :
            case "nodebuffer" :
               return utils.transformTo(options.type.toLowerCase(), zip);
            case "blob" :
               return utils.arrayBuffer2Blob(utils.transformTo("arraybuffer", zip), options.mimeType);
            // case "zip is a string"
            case "base64" :
               return (options.base64) ? base64.encode(zip) : zip;
            default : // case "string" :
               return zip;
         }

    },

    /**
     * @deprecated
     * This method will be removed in a future version without replacement.
     */
    crc32: function (input, crc) {
        return crc32(input, crc);
    },

    /**
     * @deprecated
     * This method will be removed in a future version without replacement.
     */
    utf8encode: function (string) {
        return utils.transformTo("string", utf8.utf8encode(string));
    },

    /**
     * @deprecated
     * This method will be removed in a future version without replacement.
     */
    utf8decode: function (input) {
        return utf8.utf8decode(input);
    }
};
module.exports = out;

},{"./base64":5,"./compressedObject":6,"./compressions":7,"./crc32":8,"./defaults":10,"./nodeBuffer":15,"./signature":18,"./stringWriter":20,"./support":21,"./uint8ArrayWriter":23,"./utf8":24,"./utils":25}],18:[function(require,module,exports){
'use strict';
exports.LOCAL_FILE_HEADER = "PK\x03\x04";
exports.CENTRAL_FILE_HEADER = "PK\x01\x02";
exports.CENTRAL_DIRECTORY_END = "PK\x05\x06";
exports.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x06\x07";
exports.ZIP64_CENTRAL_DIRECTORY_END = "PK\x06\x06";
exports.DATA_DESCRIPTOR = "PK\x07\x08";

},{}],19:[function(require,module,exports){
'use strict';
var DataReader = require('./dataReader');
var utils = require('./utils');

function StringReader(data, optimizedBinaryString) {
    this.data = data;
    if (!optimizedBinaryString) {
        this.data = utils.string2binary(this.data);
    }
    this.length = this.data.length;
    this.index = 0;
}
StringReader.prototype = new DataReader();
/**
 * @see DataReader.byteAt
 */
StringReader.prototype.byteAt = function(i) {
    return this.data.charCodeAt(i);
};
/**
 * @see DataReader.lastIndexOfSignature
 */
StringReader.prototype.lastIndexOfSignature = function(sig) {
    return this.data.lastIndexOf(sig);
};
/**
 * @see DataReader.readData
 */
StringReader.prototype.readData = function(size) {
    this.checkOffset(size);
    // this will work because the constructor applied the "& 0xff" mask.
    var result = this.data.slice(this.index, this.index + size);
    this.index += size;
    return result;
};
module.exports = StringReader;

},{"./dataReader":9,"./utils":25}],20:[function(require,module,exports){
'use strict';

var utils = require('./utils');

/**
 * An object to write any content to a string.
 * @constructor
 */
var StringWriter = function() {
    this.data = [];
};
StringWriter.prototype = {
    /**
     * Append any content to the current string.
     * @param {Object} input the content to add.
     */
    append: function(input) {
        input = utils.transformTo("string", input);
        this.data.push(input);
    },
    /**
     * Finalize the construction an return the result.
     * @return {string} the generated string.
     */
    finalize: function() {
        return this.data.join("");
    }
};

module.exports = StringWriter;

},{"./utils":25}],21:[function(require,module,exports){
(function (Buffer){
'use strict';
exports.base64 = true;
exports.array = true;
exports.string = true;
exports.arraybuffer = typeof ArrayBuffer !== "undefined" && typeof Uint8Array !== "undefined";
// contains true if JSZip can read/generate nodejs Buffer, false otherwise.
// Browserify will provide a Buffer implementation for browsers, which is
// an augmented Uint8Array (i.e., can be used as either Buffer or U8).
exports.nodebuffer = typeof Buffer !== "undefined";
// contains true if JSZip can read/generate Uint8Array, false otherwise.
exports.uint8array = typeof Uint8Array !== "undefined";

if (typeof ArrayBuffer === "undefined") {
    exports.blob = false;
}
else {
    var buffer = new ArrayBuffer(0);
    try {
        exports.blob = new Blob([buffer], {
            type: "application/zip"
        }).size === 0;
    }
    catch (e) {
        try {
            var Builder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
            var builder = new Builder();
            builder.append(buffer);
            exports.blob = builder.getBlob('application/zip').size === 0;
        }
        catch (e) {
            exports.blob = false;
        }
    }
}

}).call(this,require("buffer").Buffer)
},{"buffer":1}],22:[function(require,module,exports){
'use strict';
var DataReader = require('./dataReader');

function Uint8ArrayReader(data) {
    if (data) {
        this.data = data;
        this.length = this.data.length;
        this.index = 0;
    }
}
Uint8ArrayReader.prototype = new DataReader();
/**
 * @see DataReader.byteAt
 */
Uint8ArrayReader.prototype.byteAt = function(i) {
    return this.data[i];
};
/**
 * @see DataReader.lastIndexOfSignature
 */
Uint8ArrayReader.prototype.lastIndexOfSignature = function(sig) {
    var sig0 = sig.charCodeAt(0),
        sig1 = sig.charCodeAt(1),
        sig2 = sig.charCodeAt(2),
        sig3 = sig.charCodeAt(3);
    for (var i = this.length - 4; i >= 0; --i) {
        if (this.data[i] === sig0 && this.data[i + 1] === sig1 && this.data[i + 2] === sig2 && this.data[i + 3] === sig3) {
            return i;
        }
    }

    return -1;
};
/**
 * @see DataReader.readData
 */
Uint8ArrayReader.prototype.readData = function(size) {
    this.checkOffset(size);
    if(size === 0) {
        // in IE10, when using subarray(idx, idx), we get the array [0x00] instead of [].
        return new Uint8Array(0);
    }
    var result = this.data.subarray(this.index, this.index + size);
    this.index += size;
    return result;
};
module.exports = Uint8ArrayReader;

},{"./dataReader":9}],23:[function(require,module,exports){
'use strict';

var utils = require('./utils');

/**
 * An object to write any content to an Uint8Array.
 * @constructor
 * @param {number} length The length of the array.
 */
var Uint8ArrayWriter = function(length) {
    this.data = new Uint8Array(length);
    this.index = 0;
};
Uint8ArrayWriter.prototype = {
    /**
     * Append any content to the current array.
     * @param {Object} input the content to add.
     */
    append: function(input) {
        if (input.length !== 0) {
            // with an empty Uint8Array, Opera fails with a "Offset larger than array size"
            input = utils.transformTo("uint8array", input);
            this.data.set(input, this.index);
            this.index += input.length;
        }
    },
    /**
     * Finalize the construction an return the result.
     * @return {Uint8Array} the generated array.
     */
    finalize: function() {
        return this.data;
    }
};

module.exports = Uint8ArrayWriter;

},{"./utils":25}],24:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var support = require('./support');
var nodeBuffer = require('./nodeBuffer');

/**
 * The following functions come from pako, from pako/lib/utils/strings
 * released under the MIT license, see pako https://github.com/nodeca/pako/
 */

// Table with utf8 lengths (calculated by first byte of sequence)
// Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
// because max possible codepoint is 0x10ffff
var _utf8len = new Array(256);
for (var i=0; i<256; i++) {
  _utf8len[i] = (i >= 252 ? 6 : i >= 248 ? 5 : i >= 240 ? 4 : i >= 224 ? 3 : i >= 192 ? 2 : 1);
}
_utf8len[254]=_utf8len[254]=1; // Invalid sequence start

// convert string to array (typed, when possible)
var string2buf = function (str) {
    var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;

    // count binary size
    for (m_pos = 0; m_pos < str_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 0xfc00) === 0xd800 && (m_pos+1 < str_len)) {
            c2 = str.charCodeAt(m_pos+1);
            if ((c2 & 0xfc00) === 0xdc00) {
                c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
                m_pos++;
            }
        }
        buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
    }

    // allocate buffer
    if (support.uint8array) {
        buf = new Uint8Array(buf_len);
    } else {
        buf = new Array(buf_len);
    }

    // convert
    for (i=0, m_pos = 0; i < buf_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 0xfc00) === 0xd800 && (m_pos+1 < str_len)) {
            c2 = str.charCodeAt(m_pos+1);
            if ((c2 & 0xfc00) === 0xdc00) {
                c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
                m_pos++;
            }
        }
        if (c < 0x80) {
            /* one byte */
            buf[i++] = c;
        } else if (c < 0x800) {
            /* two bytes */
            buf[i++] = 0xC0 | (c >>> 6);
            buf[i++] = 0x80 | (c & 0x3f);
        } else if (c < 0x10000) {
            /* three bytes */
            buf[i++] = 0xE0 | (c >>> 12);
            buf[i++] = 0x80 | (c >>> 6 & 0x3f);
            buf[i++] = 0x80 | (c & 0x3f);
        } else {
            /* four bytes */
            buf[i++] = 0xf0 | (c >>> 18);
            buf[i++] = 0x80 | (c >>> 12 & 0x3f);
            buf[i++] = 0x80 | (c >>> 6 & 0x3f);
            buf[i++] = 0x80 | (c & 0x3f);
        }
    }

    return buf;
};

// Calculate max possible position in utf8 buffer,
// that will not break sequence. If that's not possible
// - (very small limits) return max size as is.
//
// buf[] - utf8 bytes array
// max   - length limit (mandatory);
var utf8border = function(buf, max) {
    var pos;

    max = max || buf.length;
    if (max > buf.length) { max = buf.length; }

    // go back from last position, until start of sequence found
    pos = max-1;
    while (pos >= 0 && (buf[pos] & 0xC0) === 0x80) { pos--; }

    // Fuckup - very small and broken sequence,
    // return max, because we should return something anyway.
    if (pos < 0) { return max; }

    // If we came to start of buffer - that means vuffer is too small,
    // return max too.
    if (pos === 0) { return max; }

    return (pos + _utf8len[buf[pos]] > max) ? pos : max;
};

// convert array to string
var buf2string = function (buf) {
    var str, i, out, c, c_len;
    var len = buf.length;

    // Reserve max possible length (2 words per char)
    // NB: by unknown reasons, Array is significantly faster for
    //     String.fromCharCode.apply than Uint16Array.
    var utf16buf = new Array(len*2);

    for (out=0, i=0; i<len;) {
        c = buf[i++];
        // quick process ascii
        if (c < 0x80) { utf16buf[out++] = c; continue; }

        c_len = _utf8len[c];
        // skip 5 & 6 byte codes
        if (c_len > 4) { utf16buf[out++] = 0xfffd; i += c_len-1; continue; }

        // apply mask on first byte
        c &= c_len === 2 ? 0x1f : c_len === 3 ? 0x0f : 0x07;
        // join the rest
        while (c_len > 1 && i < len) {
            c = (c << 6) | (buf[i++] & 0x3f);
            c_len--;
        }

        // terminated by end of string?
        if (c_len > 1) { utf16buf[out++] = 0xfffd; continue; }

        if (c < 0x10000) {
            utf16buf[out++] = c;
        } else {
            c -= 0x10000;
            utf16buf[out++] = 0xd800 | ((c >> 10) & 0x3ff);
            utf16buf[out++] = 0xdc00 | (c & 0x3ff);
        }
    }

    // shrinkBuf(utf16buf, out)
    if (utf16buf.length !== out) {
        if(utf16buf.subarray) {
            utf16buf = utf16buf.subarray(0, out);
        } else {
            utf16buf.length = out;
        }
    }

    // return String.fromCharCode.apply(null, utf16buf);
    return utils.applyFromCharCode(utf16buf);
};


// That's all for the pako functions.


/**
 * Transform a javascript string into an array (typed if possible) of bytes,
 * UTF-8 encoded.
 * @param {String} str the string to encode
 * @return {Array|Uint8Array|Buffer} the UTF-8 encoded string.
 */
exports.utf8encode = function utf8encode(str) {
    if (support.nodebuffer) {
        return nodeBuffer(str, "utf-8");
    }

    return string2buf(str);
};


/**
 * Transform a bytes array (or a representation) representing an UTF-8 encoded
 * string into a javascript string.
 * @param {Array|Uint8Array|Buffer} buf the data de decode
 * @return {String} the decoded string.
 */
exports.utf8decode = function utf8decode(buf) {
    if (support.nodebuffer) {
        return utils.transformTo("nodebuffer", buf).toString("utf-8");
    }

    buf = utils.transformTo(support.uint8array ? "uint8array" : "array", buf);

    // return buf2string(buf);
    // Chrome prefers to work with "small" chunks of data
    // for the method buf2string.
    // Firefox and Chrome has their own shortcut, IE doesn't seem to really care.
    var result = [], k = 0, len = buf.length, chunk = 65536;
    while (k < len) {
        var nextBoundary = utf8border(buf, Math.min(k + chunk, len));
        if (support.uint8array) {
            result.push(buf2string(buf.subarray(k, nextBoundary)));
        } else {
            result.push(buf2string(buf.slice(k, nextBoundary)));
        }
        k = nextBoundary;
    }
    return result.join("");

};
// vim: set shiftwidth=4 softtabstop=4:

},{"./nodeBuffer":15,"./support":21,"./utils":25}],25:[function(require,module,exports){
'use strict';
var support = require('./support');
var compressions = require('./compressions');
var nodeBuffer = require('./nodeBuffer');
/**
 * Convert a string to a "binary string" : a string containing only char codes between 0 and 255.
 * @param {string} str the string to transform.
 * @return {String} the binary string.
 */
exports.string2binary = function(str) {
    var result = "";
    for (var i = 0; i < str.length; i++) {
        result += String.fromCharCode(str.charCodeAt(i) & 0xff);
    }
    return result;
};
exports.arrayBuffer2Blob = function(buffer, mimeType) {
    exports.checkSupport("blob");
	mimeType = mimeType || 'application/zip';

    try {
        // Blob constructor
        return new Blob([buffer], {
            type: mimeType
        });
    }
    catch (e) {

        try {
            // deprecated, browser only, old way
            var Builder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
            var builder = new Builder();
            builder.append(buffer);
            return builder.getBlob(mimeType);
        }
        catch (e) {

            // well, fuck ?!
            throw new Error("Bug : can't construct the Blob.");
        }
    }


};
/**
 * The identity function.
 * @param {Object} input the input.
 * @return {Object} the same input.
 */
function identity(input) {
    return input;
}

/**
 * Fill in an array with a string.
 * @param {String} str the string to use.
 * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to fill in (will be mutated).
 * @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated array.
 */
function stringToArrayLike(str, array) {
    for (var i = 0; i < str.length; ++i) {
        array[i] = str.charCodeAt(i) & 0xFF;
    }
    return array;
}

/**
 * Transform an array-like object to a string.
 * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
 * @return {String} the result.
 */
function arrayLikeToString(array) {
    // Performances notes :
    // --------------------
    // String.fromCharCode.apply(null, array) is the fastest, see
    // see http://jsperf.com/converting-a-uint8array-to-a-string/2
    // but the stack is limited (and we can get huge arrays !).
    //
    // result += String.fromCharCode(array[i]); generate too many strings !
    //
    // This code is inspired by http://jsperf.com/arraybuffer-to-string-apply-performance/2
    var chunk = 65536;
    var result = [],
        len = array.length,
        type = exports.getTypeOf(array),
        k = 0,
        canUseApply = true;
      try {
         switch(type) {
            case "uint8array":
               String.fromCharCode.apply(null, new Uint8Array(0));
               break;
            case "nodebuffer":
               String.fromCharCode.apply(null, nodeBuffer(0));
               break;
         }
      } catch(e) {
         canUseApply = false;
      }

      // no apply : slow and painful algorithm
      // default browser on android 4.*
      if (!canUseApply) {
         var resultStr = "";
         for(var i = 0; i < array.length;i++) {
            resultStr += String.fromCharCode(array[i]);
         }
    return resultStr;
    }
    while (k < len && chunk > 1) {
        try {
            if (type === "array" || type === "nodebuffer") {
                result.push(String.fromCharCode.apply(null, array.slice(k, Math.min(k + chunk, len))));
            }
            else {
                result.push(String.fromCharCode.apply(null, array.subarray(k, Math.min(k + chunk, len))));
            }
            k += chunk;
        }
        catch (e) {
            chunk = Math.floor(chunk / 2);
        }
    }
    return result.join("");
}

exports.applyFromCharCode = arrayLikeToString;


/**
 * Copy the data from an array-like to an other array-like.
 * @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayFrom the origin array.
 * @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayTo the destination array which will be mutated.
 * @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated destination array.
 */
function arrayLikeToArrayLike(arrayFrom, arrayTo) {
    for (var i = 0; i < arrayFrom.length; i++) {
        arrayTo[i] = arrayFrom[i];
    }
    return arrayTo;
}

// a matrix containing functions to transform everything into everything.
var transform = {};

// string to ?
transform["string"] = {
    "string": identity,
    "array": function(input) {
        return stringToArrayLike(input, new Array(input.length));
    },
    "arraybuffer": function(input) {
        return transform["string"]["uint8array"](input).buffer;
    },
    "uint8array": function(input) {
        return stringToArrayLike(input, new Uint8Array(input.length));
    },
    "nodebuffer": function(input) {
        return stringToArrayLike(input, nodeBuffer(input.length));
    }
};

// array to ?
transform["array"] = {
    "string": arrayLikeToString,
    "array": identity,
    "arraybuffer": function(input) {
        return (new Uint8Array(input)).buffer;
    },
    "uint8array": function(input) {
        return new Uint8Array(input);
    },
    "nodebuffer": function(input) {
        return nodeBuffer(input);
    }
};

// arraybuffer to ?
transform["arraybuffer"] = {
    "string": function(input) {
        return arrayLikeToString(new Uint8Array(input));
    },
    "array": function(input) {
        return arrayLikeToArrayLike(new Uint8Array(input), new Array(input.byteLength));
    },
    "arraybuffer": identity,
    "uint8array": function(input) {
        return new Uint8Array(input);
    },
    "nodebuffer": function(input) {
        return nodeBuffer(new Uint8Array(input));
    }
};

// uint8array to ?
transform["uint8array"] = {
    "string": arrayLikeToString,
    "array": function(input) {
        return arrayLikeToArrayLike(input, new Array(input.length));
    },
    "arraybuffer": function(input) {
        return input.buffer;
    },
    "uint8array": identity,
    "nodebuffer": function(input) {
        return nodeBuffer(input);
    }
};

// nodebuffer to ?
transform["nodebuffer"] = {
    "string": arrayLikeToString,
    "array": function(input) {
        return arrayLikeToArrayLike(input, new Array(input.length));
    },
    "arraybuffer": function(input) {
        return transform["nodebuffer"]["uint8array"](input).buffer;
    },
    "uint8array": function(input) {
        return arrayLikeToArrayLike(input, new Uint8Array(input.length));
    },
    "nodebuffer": identity
};

/**
 * Transform an input into any type.
 * The supported output type are : string, array, uint8array, arraybuffer, nodebuffer.
 * If no output type is specified, the unmodified input will be returned.
 * @param {String} outputType the output type.
 * @param {String|Array|ArrayBuffer|Uint8Array|Buffer} input the input to convert.
 * @throws {Error} an Error if the browser doesn't support the requested output type.
 */
exports.transformTo = function(outputType, input) {
    if (!input) {
        // undefined, null, etc
        // an empty string won't harm.
        input = "";
    }
    if (!outputType) {
        return input;
    }
    exports.checkSupport(outputType);
    var inputType = exports.getTypeOf(input);
    var result = transform[inputType][outputType](input);
    return result;
};

/**
 * Return the type of the input.
 * The type will be in a format valid for JSZip.utils.transformTo : string, array, uint8array, arraybuffer.
 * @param {Object} input the input to identify.
 * @return {String} the (lowercase) type of the input.
 */
exports.getTypeOf = function(input) {
    if (typeof input === "string") {
        return "string";
    }
    if (Object.prototype.toString.call(input) === "[object Array]") {
        return "array";
    }
    if (support.nodebuffer && nodeBuffer.test(input)) {
        return "nodebuffer";
    }
    if (support.uint8array && input instanceof Uint8Array) {
        return "uint8array";
    }
    if (support.arraybuffer && input instanceof ArrayBuffer) {
        return "arraybuffer";
    }
};

/**
 * Throw an exception if the type is not supported.
 * @param {String} type the type to check.
 * @throws {Error} an Error if the browser doesn't support the requested type.
 */
exports.checkSupport = function(type) {
    var supported = support[type.toLowerCase()];
    if (!supported) {
        throw new Error(type + " is not supported by this browser");
    }
};
exports.MAX_VALUE_16BITS = 65535;
exports.MAX_VALUE_32BITS = -1; // well, "\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF" is parsed as -1

/**
 * Prettify a string read as binary.
 * @param {string} str the string to prettify.
 * @return {string} a pretty string.
 */
exports.pretty = function(str) {
    var res = '',
        code, i;
    for (i = 0; i < (str || "").length; i++) {
        code = str.charCodeAt(i);
        res += '\\x' + (code < 16 ? "0" : "") + code.toString(16).toUpperCase();
    }
    return res;
};

/**
 * Find a compression registered in JSZip.
 * @param {string} compressionMethod the method magic to find.
 * @return {Object|null} the JSZip compression object, null if none found.
 */
exports.findCompression = function(compressionMethod) {
    for (var method in compressions) {
        if (!compressions.hasOwnProperty(method)) {
            continue;
        }
        if (compressions[method].magic === compressionMethod) {
            return compressions[method];
        }
    }
    return null;
};
/**
* Cross-window, cross-Node-context regular expression detection
* @param  {Object}  object Anything
* @return {Boolean}        true if the object is a regular expression,
* false otherwise
*/
exports.isRegExp = function (object) {
    return Object.prototype.toString.call(object) === "[object RegExp]";
};


},{"./compressions":7,"./nodeBuffer":15,"./support":21}],26:[function(require,module,exports){
'use strict';
var StringReader = require('./stringReader');
var NodeBufferReader = require('./nodeBufferReader');
var Uint8ArrayReader = require('./uint8ArrayReader');
var utils = require('./utils');
var sig = require('./signature');
var ZipEntry = require('./zipEntry');
var support = require('./support');
var jszipProto = require('./object');
//  class ZipEntries {{{
/**
 * All the entries in the zip file.
 * @constructor
 * @param {String|ArrayBuffer|Uint8Array} data the binary stream to load.
 * @param {Object} loadOptions Options for loading the stream.
 */
function ZipEntries(data, loadOptions) {
    this.files = [];
    this.loadOptions = loadOptions;
    if (data) {
        this.load(data);
    }
}
ZipEntries.prototype = {
    /**
     * Check that the reader is on the speficied signature.
     * @param {string} expectedSignature the expected signature.
     * @throws {Error} if it is an other signature.
     */
    checkSignature: function(expectedSignature) {
        var signature = this.reader.readString(4);
        if (signature !== expectedSignature) {
            throw new Error("Corrupted zip or bug : unexpected signature " + "(" + utils.pretty(signature) + ", expected " + utils.pretty(expectedSignature) + ")");
        }
    },
    /**
     * Read the end of the central directory.
     */
    readBlockEndOfCentral: function() {
        this.diskNumber = this.reader.readInt(2);
        this.diskWithCentralDirStart = this.reader.readInt(2);
        this.centralDirRecordsOnThisDisk = this.reader.readInt(2);
        this.centralDirRecords = this.reader.readInt(2);
        this.centralDirSize = this.reader.readInt(4);
        this.centralDirOffset = this.reader.readInt(4);

        this.zipCommentLength = this.reader.readInt(2);
        // warning : the encoding depends of the system locale
        // On a linux machine with LANG=en_US.utf8, this field is utf8 encoded.
        // On a windows machine, this field is encoded with the localized windows code page.
        this.zipComment = this.reader.readString(this.zipCommentLength);
        // To get consistent behavior with the generation part, we will assume that
        // this is utf8 encoded.
        this.zipComment = jszipProto.utf8decode(this.zipComment);
    },
    /**
     * Read the end of the Zip 64 central directory.
     * Not merged with the method readEndOfCentral :
     * The end of central can coexist with its Zip64 brother,
     * I don't want to read the wrong number of bytes !
     */
    readBlockZip64EndOfCentral: function() {
        this.zip64EndOfCentralSize = this.reader.readInt(8);
        this.versionMadeBy = this.reader.readString(2);
        this.versionNeeded = this.reader.readInt(2);
        this.diskNumber = this.reader.readInt(4);
        this.diskWithCentralDirStart = this.reader.readInt(4);
        this.centralDirRecordsOnThisDisk = this.reader.readInt(8);
        this.centralDirRecords = this.reader.readInt(8);
        this.centralDirSize = this.reader.readInt(8);
        this.centralDirOffset = this.reader.readInt(8);

        this.zip64ExtensibleData = {};
        var extraDataSize = this.zip64EndOfCentralSize - 44,
            index = 0,
            extraFieldId,
            extraFieldLength,
            extraFieldValue;
        while (index < extraDataSize) {
            extraFieldId = this.reader.readInt(2);
            extraFieldLength = this.reader.readInt(4);
            extraFieldValue = this.reader.readString(extraFieldLength);
            this.zip64ExtensibleData[extraFieldId] = {
                id: extraFieldId,
                length: extraFieldLength,
                value: extraFieldValue
            };
        }
    },
    /**
     * Read the end of the Zip 64 central directory locator.
     */
    readBlockZip64EndOfCentralLocator: function() {
        this.diskWithZip64CentralDirStart = this.reader.readInt(4);
        this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8);
        this.disksCount = this.reader.readInt(4);
        if (this.disksCount > 1) {
            throw new Error("Multi-volumes zip are not supported");
        }
    },
    /**
     * Read the local files, based on the offset read in the central part.
     */
    readLocalFiles: function() {
        var i, file;
        for (i = 0; i < this.files.length; i++) {
            file = this.files[i];
            this.reader.setIndex(file.localHeaderOffset);
            this.checkSignature(sig.LOCAL_FILE_HEADER);
            file.readLocalPart(this.reader);
            file.handleUTF8();
            file.processAttributes();
        }
    },
    /**
     * Read the central directory.
     */
    readCentralDir: function() {
        var file;

        this.reader.setIndex(this.centralDirOffset);
        while (this.reader.readString(4) === sig.CENTRAL_FILE_HEADER) {
            file = new ZipEntry({
                zip64: this.zip64
            }, this.loadOptions);
            file.readCentralPart(this.reader);
            this.files.push(file);
        }
    },
    /**
     * Read the end of central directory.
     */
    readEndOfCentral: function() {
        var offset = this.reader.lastIndexOfSignature(sig.CENTRAL_DIRECTORY_END);
        if (offset === -1) {
            // Check if the content is a truncated zip or complete garbage.
            // A "LOCAL_FILE_HEADER" is not required at the beginning (auto
            // extractible zip for example) but it can give a good hint.
            // If an ajax request was used without responseType, we will also
            // get unreadable data.
            var isGarbage = true;
            try {
                this.reader.setIndex(0);
                this.checkSignature(sig.LOCAL_FILE_HEADER);
                isGarbage = false;
            } catch (e) {}

            if (isGarbage) {
                throw new Error("Can't find end of central directory : is this a zip file ? " +
                                "If it is, see http://stuk.github.io/jszip/documentation/howto/read_zip.html");
            } else {
                throw new Error("Corrupted zip : can't find end of central directory");
            }
        }
        this.reader.setIndex(offset);
        this.checkSignature(sig.CENTRAL_DIRECTORY_END);
        this.readBlockEndOfCentral();


        /* extract from the zip spec :
            4)  If one of the fields in the end of central directory
                record is too small to hold required data, the field
                should be set to -1 (0xFFFF or 0xFFFFFFFF) and the
                ZIP64 format record should be created.
            5)  The end of central directory record and the
                Zip64 end of central directory locator record must
                reside on the same disk when splitting or spanning
                an archive.
         */
        if (this.diskNumber === utils.MAX_VALUE_16BITS || this.diskWithCentralDirStart === utils.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === utils.MAX_VALUE_16BITS || this.centralDirRecords === utils.MAX_VALUE_16BITS || this.centralDirSize === utils.MAX_VALUE_32BITS || this.centralDirOffset === utils.MAX_VALUE_32BITS) {
            this.zip64 = true;

            /*
            Warning : the zip64 extension is supported, but ONLY if the 64bits integer read from
            the zip file can fit into a 32bits integer. This cannot be solved : Javascript represents
            all numbers as 64-bit double precision IEEE 754 floating point numbers.
            So, we have 53bits for integers and bitwise operations treat everything as 32bits.
            see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/Bitwise_Operators
            and http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf section 8.5
            */

            // should look for a zip64 EOCD locator
            offset = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
            if (offset === -1) {
                throw new Error("Corrupted zip : can't find the ZIP64 end of central directory locator");
            }
            this.reader.setIndex(offset);
            this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
            this.readBlockZip64EndOfCentralLocator();

            // now the zip64 EOCD record
            this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir);
            this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
            this.readBlockZip64EndOfCentral();
        }
    },
    prepareReader: function(data) {
        var type = utils.getTypeOf(data);
        if (type === "string" && !support.uint8array) {
            this.reader = new StringReader(data, this.loadOptions.optimizedBinaryString);
        }
        else if (type === "nodebuffer") {
            this.reader = new NodeBufferReader(data);
        }
        else {
            this.reader = new Uint8ArrayReader(utils.transformTo("uint8array", data));
        }
    },
    /**
     * Read a zip file and create ZipEntries.
     * @param {String|ArrayBuffer|Uint8Array|Buffer} data the binary string representing a zip file.
     */
    load: function(data) {
        this.prepareReader(data);
        this.readEndOfCentral();
        this.readCentralDir();
        this.readLocalFiles();
    }
};
// }}} end of ZipEntries
module.exports = ZipEntries;

},{"./nodeBufferReader":16,"./object":17,"./signature":18,"./stringReader":19,"./support":21,"./uint8ArrayReader":22,"./utils":25,"./zipEntry":27}],27:[function(require,module,exports){
'use strict';
var StringReader = require('./stringReader');
var utils = require('./utils');
var CompressedObject = require('./compressedObject');
var jszipProto = require('./object');

var MADE_BY_DOS = 0x00;
var MADE_BY_UNIX = 0x03;

// class ZipEntry {{{
/**
 * An entry in the zip file.
 * @constructor
 * @param {Object} options Options of the current file.
 * @param {Object} loadOptions Options for loading the stream.
 */
function ZipEntry(options, loadOptions) {
    this.options = options;
    this.loadOptions = loadOptions;
}
ZipEntry.prototype = {
    /**
     * say if the file is encrypted.
     * @return {boolean} true if the file is encrypted, false otherwise.
     */
    isEncrypted: function() {
        // bit 1 is set
        return (this.bitFlag & 0x0001) === 0x0001;
    },
    /**
     * say if the file has utf-8 filename/comment.
     * @return {boolean} true if the filename/comment is in utf-8, false otherwise.
     */
    useUTF8: function() {
        // bit 11 is set
        return (this.bitFlag & 0x0800) === 0x0800;
    },
    /**
     * Prepare the function used to generate the compressed content from this ZipFile.
     * @param {DataReader} reader the reader to use.
     * @param {number} from the offset from where we should read the data.
     * @param {number} length the length of the data to read.
     * @return {Function} the callback to get the compressed content (the type depends of the DataReader class).
     */
    prepareCompressedContent: function(reader, from, length) {
        return function() {
            var previousIndex = reader.index;
            reader.setIndex(from);
            var compressedFileData = reader.readData(length);
            reader.setIndex(previousIndex);

            return compressedFileData;
        };
    },
    /**
     * Prepare the function used to generate the uncompressed content from this ZipFile.
     * @param {DataReader} reader the reader to use.
     * @param {number} from the offset from where we should read the data.
     * @param {number} length the length of the data to read.
     * @param {JSZip.compression} compression the compression used on this file.
     * @param {number} uncompressedSize the uncompressed size to expect.
     * @return {Function} the callback to get the uncompressed content (the type depends of the DataReader class).
     */
    prepareContent: function(reader, from, length, compression, uncompressedSize) {
        return function() {

            var compressedFileData = utils.transformTo(compression.uncompressInputType, this.getCompressedContent());
            var uncompressedFileData = compression.uncompress(compressedFileData);

            if (uncompressedFileData.length !== uncompressedSize) {
                throw new Error("Bug : uncompressed data size mismatch");
            }

            return uncompressedFileData;
        };
    },
    /**
     * Read the local part of a zip file and add the info in this object.
     * @param {DataReader} reader the reader to use.
     */
    readLocalPart: function(reader) {
        var compression, localExtraFieldsLength;

        // we already know everything from the central dir !
        // If the central dir data are false, we are doomed.
        // On the bright side, the local part is scary  : zip64, data descriptors, both, etc.
        // The less data we get here, the more reliable this should be.
        // Let's skip the whole header and dash to the data !
        reader.skip(22);
        // in some zip created on windows, the filename stored in the central dir contains \ instead of /.
        // Strangely, the filename here is OK.
        // I would love to treat these zip files as corrupted (see http://www.info-zip.org/FAQ.html#backslashes
        // or APPNOTE#4.4.17.1, "All slashes MUST be forward slashes '/'") but there are a lot of bad zip generators...
        // Search "unzip mismatching "local" filename continuing with "central" filename version" on
        // the internet.
        //
        // I think I see the logic here : the central directory is used to display
        // content and the local directory is used to extract the files. Mixing / and \
        // may be used to display \ to windows users and use / when extracting the files.
        // Unfortunately, this lead also to some issues : http://seclists.org/fulldisclosure/2009/Sep/394
        this.fileNameLength = reader.readInt(2);
        localExtraFieldsLength = reader.readInt(2); // can't be sure this will be the same as the central dir
        this.fileName = reader.readString(this.fileNameLength);
        reader.skip(localExtraFieldsLength);

        if (this.compressedSize == -1 || this.uncompressedSize == -1) {
            throw new Error("Bug or corrupted zip : didn't get enough informations from the central directory " + "(compressedSize == -1 || uncompressedSize == -1)");
        }

        compression = utils.findCompression(this.compressionMethod);
        if (compression === null) { // no compression found
            throw new Error("Corrupted zip : compression " + utils.pretty(this.compressionMethod) + " unknown (inner file : " + this.fileName + ")");
        }
        this.decompressed = new CompressedObject();
        this.decompressed.compressedSize = this.compressedSize;
        this.decompressed.uncompressedSize = this.uncompressedSize;
        this.decompressed.crc32 = this.crc32;
        this.decompressed.compressionMethod = this.compressionMethod;
        this.decompressed.getCompressedContent = this.prepareCompressedContent(reader, reader.index, this.compressedSize, compression);
        this.decompressed.getContent = this.prepareContent(reader, reader.index, this.compressedSize, compression, this.uncompressedSize);

        // we need to compute the crc32...
        if (this.loadOptions.checkCRC32) {
            this.decompressed = utils.transformTo("string", this.decompressed.getContent());
            if (jszipProto.crc32(this.decompressed) !== this.crc32) {
                throw new Error("Corrupted zip : CRC32 mismatch");
            }
        }
    },

    /**
     * Read the central part of a zip file and add the info in this object.
     * @param {DataReader} reader the reader to use.
     */
    readCentralPart: function(reader) {
        this.versionMadeBy = reader.readInt(2);
        this.versionNeeded = reader.readInt(2);
        this.bitFlag = reader.readInt(2);
        this.compressionMethod = reader.readString(2);
        this.date = reader.readDate();
        this.crc32 = reader.readInt(4);
        this.compressedSize = reader.readInt(4);
        this.uncompressedSize = reader.readInt(4);
        this.fileNameLength = reader.readInt(2);
        this.extraFieldsLength = reader.readInt(2);
        this.fileCommentLength = reader.readInt(2);
        this.diskNumberStart = reader.readInt(2);
        this.internalFileAttributes = reader.readInt(2);
        this.externalFileAttributes = reader.readInt(4);
        this.localHeaderOffset = reader.readInt(4);

        if (this.isEncrypted()) {
            throw new Error("Encrypted zip are not supported");
        }

        this.fileName = reader.readString(this.fileNameLength);
        this.readExtraFields(reader);
        this.parseZIP64ExtraField(reader);
        this.fileComment = reader.readString(this.fileCommentLength);
    },

    /**
     * Parse the external file attributes and get the unix/dos permissions.
     */
    processAttributes: function () {
        this.unixPermissions = null;
        this.dosPermissions = null;
        var madeBy = this.versionMadeBy >> 8;

        // Check if we have the DOS directory flag set.
        // We look for it in the DOS and UNIX permissions
        // but some unknown platform could set it as a compatibility flag.
        this.dir = this.externalFileAttributes & 0x0010 ? true : false;

        if(madeBy === MADE_BY_DOS) {
            // first 6 bits (0 to 5)
            this.dosPermissions = this.externalFileAttributes & 0x3F;
        }

        if(madeBy === MADE_BY_UNIX) {
            this.unixPermissions = (this.externalFileAttributes >> 16) & 0xFFFF;
            // the octal permissions are in (this.unixPermissions & 0x01FF).toString(8);
        }

        // fail safe : if the name ends with a / it probably means a folder
        if (!this.dir && this.fileName.slice(-1) === '/') {
            this.dir = true;
        }
    },

    /**
     * Parse the ZIP64 extra field and merge the info in the current ZipEntry.
     * @param {DataReader} reader the reader to use.
     */
    parseZIP64ExtraField: function(reader) {

        if (!this.extraFields[0x0001]) {
            return;
        }

        // should be something, preparing the extra reader
        var extraReader = new StringReader(this.extraFields[0x0001].value);

        // I really hope that these 64bits integer can fit in 32 bits integer, because js
        // won't let us have more.
        if (this.uncompressedSize === utils.MAX_VALUE_32BITS) {
            this.uncompressedSize = extraReader.readInt(8);
        }
        if (this.compressedSize === utils.MAX_VALUE_32BITS) {
            this.compressedSize = extraReader.readInt(8);
        }
        if (this.localHeaderOffset === utils.MAX_VALUE_32BITS) {
            this.localHeaderOffset = extraReader.readInt(8);
        }
        if (this.diskNumberStart === utils.MAX_VALUE_32BITS) {
            this.diskNumberStart = extraReader.readInt(4);
        }
    },
    /**
     * Read the central part of a zip file and add the info in this object.
     * @param {DataReader} reader the reader to use.
     */
    readExtraFields: function(reader) {
        var start = reader.index,
            extraFieldId,
            extraFieldLength,
            extraFieldValue;

        this.extraFields = this.extraFields || {};

        while (reader.index < start + this.extraFieldsLength) {
            extraFieldId = reader.readInt(2);
            extraFieldLength = reader.readInt(2);
            extraFieldValue = reader.readString(extraFieldLength);

            this.extraFields[extraFieldId] = {
                id: extraFieldId,
                length: extraFieldLength,
                value: extraFieldValue
            };
        }
    },
    /**
     * Apply an UTF8 transformation if needed.
     */
    handleUTF8: function() {
        if (this.useUTF8()) {
            this.fileName = jszipProto.utf8decode(this.fileName);
            this.fileComment = jszipProto.utf8decode(this.fileComment);
        } else {
            var upath = this.findExtraFieldUnicodePath();
            if (upath !== null) {
                this.fileName = upath;
            }
            var ucomment = this.findExtraFieldUnicodeComment();
            if (ucomment !== null) {
                this.fileComment = ucomment;
            }
        }
    },

    /**
     * Find the unicode path declared in the extra field, if any.
     * @return {String} the unicode path, null otherwise.
     */
    findExtraFieldUnicodePath: function() {
        var upathField = this.extraFields[0x7075];
        if (upathField) {
            var extraReader = new StringReader(upathField.value);

            // wrong version
            if (extraReader.readInt(1) !== 1) {
                return null;
            }

            // the crc of the filename changed, this field is out of date.
            if (jszipProto.crc32(this.fileName) !== extraReader.readInt(4)) {
                return null;
            }

            return jszipProto.utf8decode(extraReader.readString(upathField.length - 5));
        }
        return null;
    },

    /**
     * Find the unicode comment declared in the extra field, if any.
     * @return {String} the unicode comment, null otherwise.
     */
    findExtraFieldUnicodeComment: function() {
        var ucommentField = this.extraFields[0x6375];
        if (ucommentField) {
            var extraReader = new StringReader(ucommentField.value);

            // wrong version
            if (extraReader.readInt(1) !== 1) {
                return null;
            }

            // the crc of the comment changed, this field is out of date.
            if (jszipProto.crc32(this.fileComment) !== extraReader.readInt(4)) {
                return null;
            }

            return jszipProto.utf8decode(extraReader.readString(ucommentField.length - 5));
        }
        return null;
    }
};
module.exports = ZipEntry;

},{"./compressedObject":6,"./object":17,"./stringReader":19,"./utils":25}],28:[function(require,module,exports){
// Top level file is just a mixin of submodules & constants
'use strict';

var assign    = require('./lib/utils/common').assign;

var deflate   = require('./lib/deflate');
var inflate   = require('./lib/inflate');
var constants = require('./lib/zlib/constants');

var pako = {};

assign(pako, deflate, inflate, constants);

module.exports = pako;

},{"./lib/deflate":29,"./lib/inflate":30,"./lib/utils/common":31,"./lib/zlib/constants":34}],29:[function(require,module,exports){
'use strict';


var zlib_deflate = require('./zlib/deflate.js');
var utils = require('./utils/common');
var strings = require('./utils/strings');
var msg = require('./zlib/messages');
var zstream = require('./zlib/zstream');

var toString = Object.prototype.toString;

/* Public constants ==========================================================*/
/* ===========================================================================*/

var Z_NO_FLUSH      = 0;
var Z_FINISH        = 4;

var Z_OK            = 0;
var Z_STREAM_END    = 1;
var Z_SYNC_FLUSH    = 2;

var Z_DEFAULT_COMPRESSION = -1;

var Z_DEFAULT_STRATEGY    = 0;

var Z_DEFLATED  = 8;

/* ===========================================================================*/


/**
 * class Deflate
 *
 * Generic JS-style wrapper for zlib calls. If you don't need
 * streaming behaviour - use more simple functions: [[deflate]],
 * [[deflateRaw]] and [[gzip]].
 **/

/* internal
 * Deflate.chunks -> Array
 *
 * Chunks of output data, if [[Deflate#onData]] not overriden.
 **/

/**
 * Deflate.result -> Uint8Array|Array
 *
 * Compressed result, generated by default [[Deflate#onData]]
 * and [[Deflate#onEnd]] handlers. Filled after you push last chunk
 * (call [[Deflate#push]] with `Z_FINISH` / `true` param)  or if you
 * push a chunk with explicit flush (call [[Deflate#push]] with
 * `Z_SYNC_FLUSH` param).
 **/

/**
 * Deflate.err -> Number
 *
 * Error code after deflate finished. 0 (Z_OK) on success.
 * You will not need it in real life, because deflate errors
 * are possible only on wrong options or bad `onData` / `onEnd`
 * custom handlers.
 **/

/**
 * Deflate.msg -> String
 *
 * Error message, if [[Deflate.err]] != 0
 **/


/**
 * new Deflate(options)
 * - options (Object): zlib deflate options.
 *
 * Creates new deflator instance with specified params. Throws exception
 * on bad params. Supported options:
 *
 * - `level`
 * - `windowBits`
 * - `memLevel`
 * - `strategy`
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Additional options, for internal needs:
 *
 * - `chunkSize` - size of generated data chunks (16K by default)
 * - `raw` (Boolean) - do raw deflate
 * - `gzip` (Boolean) - create gzip wrapper
 * - `to` (String) - if equal to 'string', then result will be "binary string"
 *    (each char code [0..255])
 * - `header` (Object) - custom header for gzip
 *   - `text` (Boolean) - true if compressed data believed to be text
 *   - `time` (Number) - modification time, unix timestamp
 *   - `os` (Number) - operation system code
 *   - `extra` (Array) - array of bytes with extra data (max 65536)
 *   - `name` (String) - file name (binary string)
 *   - `comment` (String) - comment (binary string)
 *   - `hcrc` (Boolean) - true if header crc should be added
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
 *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
 *
 * var deflate = new pako.Deflate({ level: 3});
 *
 * deflate.push(chunk1, false);
 * deflate.push(chunk2, true);  // true -> last chunk
 *
 * if (deflate.err) { throw new Error(deflate.err); }
 *
 * console.log(deflate.result);
 * ```
 **/
var Deflate = function(options) {

  this.options = utils.assign({
    level: Z_DEFAULT_COMPRESSION,
    method: Z_DEFLATED,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: Z_DEFAULT_STRATEGY,
    to: ''
  }, options || {});

  var opt = this.options;

  if (opt.raw && (opt.windowBits > 0)) {
    opt.windowBits = -opt.windowBits;
  }

  else if (opt.gzip && (opt.windowBits > 0) && (opt.windowBits < 16)) {
    opt.windowBits += 16;
  }

  this.err    = 0;      // error code, if happens (0 = Z_OK)
  this.msg    = '';     // error message
  this.ended  = false;  // used to avoid multiple onEnd() calls
  this.chunks = [];     // chunks of compressed data

  this.strm = new zstream();
  this.strm.avail_out = 0;

  var status = zlib_deflate.deflateInit2(
    this.strm,
    opt.level,
    opt.method,
    opt.windowBits,
    opt.memLevel,
    opt.strategy
  );

  if (status !== Z_OK) {
    throw new Error(msg[status]);
  }

  if (opt.header) {
    zlib_deflate.deflateSetHeader(this.strm, opt.header);
  }
};

/**
 * Deflate#push(data[, mode]) -> Boolean
 * - data (Uint8Array|Array|ArrayBuffer|String): input data. Strings will be
 *   converted to utf8 byte sequence.
 * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
 *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
 *
 * Sends input data to deflate pipe, generating [[Deflate#onData]] calls with
 * new compressed chunks. Returns `true` on success. The last data block must have
 * mode Z_FINISH (or `true`). That will flush internal pending buffers and call
 * [[Deflate#onEnd]]. For interim explicit flushes (without ending the stream) you
 * can use mode Z_SYNC_FLUSH, keeping the compression context.
 *
 * On fail call [[Deflate#onEnd]] with error code and return false.
 *
 * We strongly recommend to use `Uint8Array` on input for best speed (output
 * array format is detected automatically). Also, don't skip last param and always
 * use the same type in your code (boolean or number). That will improve JS speed.
 *
 * For regular `Array`-s make sure all elements are [0..255].
 *
 * ##### Example
 *
 * ```javascript
 * push(chunk, false); // push one of data chunks
 * ...
 * push(chunk, true);  // push last chunk
 * ```
 **/
Deflate.prototype.push = function(data, mode) {
  var strm = this.strm;
  var chunkSize = this.options.chunkSize;
  var status, _mode;

  if (this.ended) { return false; }

  _mode = (mode === ~~mode) ? mode : ((mode === true) ? Z_FINISH : Z_NO_FLUSH);

  // Convert data if needed
  if (typeof data === 'string') {
    // If we need to compress text, change encoding to utf8.
    strm.input = strings.string2buf(data);
  } else if (toString.call(data) === '[object ArrayBuffer]') {
    strm.input = new Uint8Array(data);
  } else {
    strm.input = data;
  }

  strm.next_in = 0;
  strm.avail_in = strm.input.length;

  do {
    if (strm.avail_out === 0) {
      strm.output = new utils.Buf8(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }
    status = zlib_deflate.deflate(strm, _mode);    /* no bad return value */

    if (status !== Z_STREAM_END && status !== Z_OK) {
      this.onEnd(status);
      this.ended = true;
      return false;
    }
    if (strm.avail_out === 0 || (strm.avail_in === 0 && (_mode === Z_FINISH || _mode === Z_SYNC_FLUSH))) {
      if (this.options.to === 'string') {
        this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out)));
      } else {
        this.onData(utils.shrinkBuf(strm.output, strm.next_out));
      }
    }
  } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);

  // Finalize on the last chunk.
  if (_mode === Z_FINISH) {
    status = zlib_deflate.deflateEnd(this.strm);
    this.onEnd(status);
    this.ended = true;
    return status === Z_OK;
  }

  // callback interim results if Z_SYNC_FLUSH.
  if (_mode === Z_SYNC_FLUSH) {
    this.onEnd(Z_OK);
    strm.avail_out = 0;
    return true;
  }

  return true;
};


/**
 * Deflate#onData(chunk) -> Void
 * - chunk (Uint8Array|Array|String): ouput data. Type of array depends
 *   on js engine support. When string output requested, each chunk
 *   will be string.
 *
 * By default, stores data blocks in `chunks[]` property and glue
 * those in `onEnd`. Override this handler, if you need another behaviour.
 **/
Deflate.prototype.onData = function(chunk) {
  this.chunks.push(chunk);
};


/**
 * Deflate#onEnd(status) -> Void
 * - status (Number): deflate status. 0 (Z_OK) on success,
 *   other if not.
 *
 * Called once after you tell deflate that the input stream is
 * complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
 * or if an error happened. By default - join collected chunks,
 * free memory and fill `results` / `err` properties.
 **/
Deflate.prototype.onEnd = function(status) {
  // On success - join
  if (status === Z_OK) {
    if (this.options.to === 'string') {
      this.result = this.chunks.join('');
    } else {
      this.result = utils.flattenChunks(this.chunks);
    }
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};


/**
 * deflate(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * Compress `data` with deflate alrorythm and `options`.
 *
 * Supported options are:
 *
 * - level
 * - windowBits
 * - memLevel
 * - strategy
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Sugar (options):
 *
 * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
 *   negative windowBits implicitly.
 * - `to` (String) - if equal to 'string', then result will be "binary string"
 *    (each char code [0..255])
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , data = Uint8Array([1,2,3,4,5,6,7,8,9]);
 *
 * console.log(pako.deflate(data));
 * ```
 **/
function deflate(input, options) {
  var deflator = new Deflate(options);

  deflator.push(input, true);

  // That will never happens, if you don't cheat with options :)
  if (deflator.err) { throw deflator.msg; }

  return deflator.result;
}


/**
 * deflateRaw(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * The same as [[deflate]], but creates raw data, without wrapper
 * (header and adler32 crc).
 **/
function deflateRaw(input, options) {
  options = options || {};
  options.raw = true;
  return deflate(input, options);
}


/**
 * gzip(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * The same as [[deflate]], but create gzip wrapper instead of
 * deflate one.
 **/
function gzip(input, options) {
  options = options || {};
  options.gzip = true;
  return deflate(input, options);
}


exports.Deflate = Deflate;
exports.deflate = deflate;
exports.deflateRaw = deflateRaw;
exports.gzip = gzip;

},{"./utils/common":31,"./utils/strings":32,"./zlib/deflate.js":36,"./zlib/messages":41,"./zlib/zstream":43}],30:[function(require,module,exports){
'use strict';


var zlib_inflate = require('./zlib/inflate.js');
var utils = require('./utils/common');
var strings = require('./utils/strings');
var c = require('./zlib/constants');
var msg = require('./zlib/messages');
var zstream = require('./zlib/zstream');
var gzheader = require('./zlib/gzheader');

var toString = Object.prototype.toString;

/**
 * class Inflate
 *
 * Generic JS-style wrapper for zlib calls. If you don't need
 * streaming behaviour - use more simple functions: [[inflate]]
 * and [[inflateRaw]].
 **/

/* internal
 * inflate.chunks -> Array
 *
 * Chunks of output data, if [[Inflate#onData]] not overriden.
 **/

/**
 * Inflate.result -> Uint8Array|Array|String
 *
 * Uncompressed result, generated by default [[Inflate#onData]]
 * and [[Inflate#onEnd]] handlers. Filled after you push last chunk
 * (call [[Inflate#push]] with `Z_FINISH` / `true` param) or if you
 * push a chunk with explicit flush (call [[Inflate#push]] with
 * `Z_SYNC_FLUSH` param).
 **/

/**
 * Inflate.err -> Number
 *
 * Error code after inflate finished. 0 (Z_OK) on success.
 * Should be checked if broken data possible.
 **/

/**
 * Inflate.msg -> String
 *
 * Error message, if [[Inflate.err]] != 0
 **/


/**
 * new Inflate(options)
 * - options (Object): zlib inflate options.
 *
 * Creates new inflator instance with specified params. Throws exception
 * on bad params. Supported options:
 *
 * - `windowBits`
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Additional options, for internal needs:
 *
 * - `chunkSize` - size of generated data chunks (16K by default)
 * - `raw` (Boolean) - do raw inflate
 * - `to` (String) - if equal to 'string', then result will be converted
 *   from utf8 to utf16 (javascript) string. When string output requested,
 *   chunk length can differ from `chunkSize`, depending on content.
 *
 * By default, when no options set, autodetect deflate/gzip data format via
 * wrapper header.
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
 *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
 *
 * var inflate = new pako.Inflate({ level: 3});
 *
 * inflate.push(chunk1, false);
 * inflate.push(chunk2, true);  // true -> last chunk
 *
 * if (inflate.err) { throw new Error(inflate.err); }
 *
 * console.log(inflate.result);
 * ```
 **/
var Inflate = function(options) {

  this.options = utils.assign({
    chunkSize: 16384,
    windowBits: 0,
    to: ''
  }, options || {});

  var opt = this.options;

  // Force window size for `raw` data, if not set directly,
  // because we have no header for autodetect.
  if (opt.raw && (opt.windowBits >= 0) && (opt.windowBits < 16)) {
    opt.windowBits = -opt.windowBits;
    if (opt.windowBits === 0) { opt.windowBits = -15; }
  }

  // If `windowBits` not defined (and mode not raw) - set autodetect flag for gzip/deflate
  if ((opt.windowBits >= 0) && (opt.windowBits < 16) &&
      !(options && options.windowBits)) {
    opt.windowBits += 32;
  }

  // Gzip header has no info about windows size, we can do autodetect only
  // for deflate. So, if window size not set, force it to max when gzip possible
  if ((opt.windowBits > 15) && (opt.windowBits < 48)) {
    // bit 3 (16) -> gzipped data
    // bit 4 (32) -> autodetect gzip/deflate
    if ((opt.windowBits & 15) === 0) {
      opt.windowBits |= 15;
    }
  }

  this.err    = 0;      // error code, if happens (0 = Z_OK)
  this.msg    = '';     // error message
  this.ended  = false;  // used to avoid multiple onEnd() calls
  this.chunks = [];     // chunks of compressed data

  this.strm   = new zstream();
  this.strm.avail_out = 0;

  var status  = zlib_inflate.inflateInit2(
    this.strm,
    opt.windowBits
  );

  if (status !== c.Z_OK) {
    throw new Error(msg[status]);
  }

  this.header = new gzheader();

  zlib_inflate.inflateGetHeader(this.strm, this.header);
};

/**
 * Inflate#push(data[, mode]) -> Boolean
 * - data (Uint8Array|Array|ArrayBuffer|String): input data
 * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
 *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
 *
 * Sends input data to inflate pipe, generating [[Inflate#onData]] calls with
 * new output chunks. Returns `true` on success. The last data block must have
 * mode Z_FINISH (or `true`). That will flush internal pending buffers and call
 * [[Inflate#onEnd]]. For interim explicit flushes (without ending the stream) you
 * can use mode Z_SYNC_FLUSH, keeping the decompression context.
 *
 * On fail call [[Inflate#onEnd]] with error code and return false.
 *
 * We strongly recommend to use `Uint8Array` on input for best speed (output
 * format is detected automatically). Also, don't skip last param and always
 * use the same type in your code (boolean or number). That will improve JS speed.
 *
 * For regular `Array`-s make sure all elements are [0..255].
 *
 * ##### Example
 *
 * ```javascript
 * push(chunk, false); // push one of data chunks
 * ...
 * push(chunk, true);  // push last chunk
 * ```
 **/
Inflate.prototype.push = function(data, mode) {
  var strm = this.strm;
  var chunkSize = this.options.chunkSize;
  var status, _mode;
  var next_out_utf8, tail, utf8str;

  if (this.ended) { return false; }
  _mode = (mode === ~~mode) ? mode : ((mode === true) ? c.Z_FINISH : c.Z_NO_FLUSH);

  // Convert data if needed
  if (typeof data === 'string') {
    // Only binary strings can be decompressed on practice
    strm.input = strings.binstring2buf(data);
  } else if (toString.call(data) === '[object ArrayBuffer]') {
    strm.input = new Uint8Array(data);
  } else {
    strm.input = data;
  }

  strm.next_in = 0;
  strm.avail_in = strm.input.length;

  do {
    if (strm.avail_out === 0) {
      strm.output = new utils.Buf8(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }

    status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);    /* no bad return value */

    if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
      this.onEnd(status);
      this.ended = true;
      return false;
    }

    if (strm.next_out) {
      if (strm.avail_out === 0 || status === c.Z_STREAM_END || (strm.avail_in === 0 && (_mode === c.Z_FINISH || _mode === c.Z_SYNC_FLUSH))) {

        if (this.options.to === 'string') {

          next_out_utf8 = strings.utf8border(strm.output, strm.next_out);

          tail = strm.next_out - next_out_utf8;
          utf8str = strings.buf2string(strm.output, next_out_utf8);

          // move tail
          strm.next_out = tail;
          strm.avail_out = chunkSize - tail;
          if (tail) { utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0); }

          this.onData(utf8str);

        } else {
          this.onData(utils.shrinkBuf(strm.output, strm.next_out));
        }
      }
    }
  } while ((strm.avail_in > 0) && status !== c.Z_STREAM_END);

  if (status === c.Z_STREAM_END) {
    _mode = c.Z_FINISH;
  }

  // Finalize on the last chunk.
  if (_mode === c.Z_FINISH) {
    status = zlib_inflate.inflateEnd(this.strm);
    this.onEnd(status);
    this.ended = true;
    return status === c.Z_OK;
  }

  // callback interim results if Z_SYNC_FLUSH.
  if (_mode === c.Z_SYNC_FLUSH) {
    this.onEnd(c.Z_OK);
    strm.avail_out = 0;
    return true;
  }

  return true;
};


/**
 * Inflate#onData(chunk) -> Void
 * - chunk (Uint8Array|Array|String): ouput data. Type of array depends
 *   on js engine support. When string output requested, each chunk
 *   will be string.
 *
 * By default, stores data blocks in `chunks[]` property and glue
 * those in `onEnd`. Override this handler, if you need another behaviour.
 **/
Inflate.prototype.onData = function(chunk) {
  this.chunks.push(chunk);
};


/**
 * Inflate#onEnd(status) -> Void
 * - status (Number): inflate status. 0 (Z_OK) on success,
 *   other if not.
 *
 * Called either after you tell inflate that the input stream is
 * complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
 * or if an error happened. By default - join collected chunks,
 * free memory and fill `results` / `err` properties.
 **/
Inflate.prototype.onEnd = function(status) {
  // On success - join
  if (status === c.Z_OK) {
    if (this.options.to === 'string') {
      // Glue & convert here, until we teach pako to send
      // utf8 alligned strings to onData
      this.result = this.chunks.join('');
    } else {
      this.result = utils.flattenChunks(this.chunks);
    }
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};


/**
 * inflate(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * Decompress `data` with inflate/ungzip and `options`. Autodetect
 * format via wrapper header by default. That's why we don't provide
 * separate `ungzip` method.
 *
 * Supported options are:
 *
 * - windowBits
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information.
 *
 * Sugar (options):
 *
 * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
 *   negative windowBits implicitly.
 * - `to` (String) - if equal to 'string', then result will be converted
 *   from utf8 to utf16 (javascript) string. When string output requested,
 *   chunk length can differ from `chunkSize`, depending on content.
 *
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , input = pako.deflate([1,2,3,4,5,6,7,8,9])
 *   , output;
 *
 * try {
 *   output = pako.inflate(input);
 * } catch (err)
 *   console.log(err);
 * }
 * ```
 **/
function inflate(input, options) {
  var inflator = new Inflate(options);

  inflator.push(input, true);

  // That will never happens, if you don't cheat with options :)
  if (inflator.err) { throw inflator.msg; }

  return inflator.result;
}


/**
 * inflateRaw(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * The same as [[inflate]], but creates raw data, without wrapper
 * (header and adler32 crc).
 **/
function inflateRaw(input, options) {
  options = options || {};
  options.raw = true;
  return inflate(input, options);
}


/**
 * ungzip(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * Just shortcut to [[inflate]], because it autodetects format
 * by header.content. Done for convenience.
 **/


exports.Inflate = Inflate;
exports.inflate = inflate;
exports.inflateRaw = inflateRaw;
exports.ungzip  = inflate;

},{"./utils/common":31,"./utils/strings":32,"./zlib/constants":34,"./zlib/gzheader":37,"./zlib/inflate.js":39,"./zlib/messages":41,"./zlib/zstream":43}],31:[function(require,module,exports){
'use strict';


var TYPED_OK =  (typeof Uint8Array !== 'undefined') &&
                (typeof Uint16Array !== 'undefined') &&
                (typeof Int32Array !== 'undefined');


exports.assign = function (obj /*from1, from2, from3, ...*/) {
  var sources = Array.prototype.slice.call(arguments, 1);
  while (sources.length) {
    var source = sources.shift();
    if (!source) { continue; }

    if (typeof source !== 'object') {
      throw new TypeError(source + 'must be non-object');
    }

    for (var p in source) {
      if (source.hasOwnProperty(p)) {
        obj[p] = source[p];
      }
    }
  }

  return obj;
};


// reduce buffer size, avoiding mem copy
exports.shrinkBuf = function (buf, size) {
  if (buf.length === size) { return buf; }
  if (buf.subarray) { return buf.subarray(0, size); }
  buf.length = size;
  return buf;
};


var fnTyped = {
  arraySet: function (dest, src, src_offs, len, dest_offs) {
    if (src.subarray && dest.subarray) {
      dest.set(src.subarray(src_offs, src_offs+len), dest_offs);
      return;
    }
    // Fallback to ordinary array
    for (var i=0; i<len; i++) {
      dest[dest_offs + i] = src[src_offs + i];
    }
  },
  // Join array of chunks to single array.
  flattenChunks: function(chunks) {
    var i, l, len, pos, chunk, result;

    // calculate data length
    len = 0;
    for (i=0, l=chunks.length; i<l; i++) {
      len += chunks[i].length;
    }

    // join chunks
    result = new Uint8Array(len);
    pos = 0;
    for (i=0, l=chunks.length; i<l; i++) {
      chunk = chunks[i];
      result.set(chunk, pos);
      pos += chunk.length;
    }

    return result;
  }
};

var fnUntyped = {
  arraySet: function (dest, src, src_offs, len, dest_offs) {
    for (var i=0; i<len; i++) {
      dest[dest_offs + i] = src[src_offs + i];
    }
  },
  // Join array of chunks to single array.
  flattenChunks: function(chunks) {
    return [].concat.apply([], chunks);
  }
};


// Enable/Disable typed arrays use, for testing
//
exports.setTyped = function (on) {
  if (on) {
    exports.Buf8  = Uint8Array;
    exports.Buf16 = Uint16Array;
    exports.Buf32 = Int32Array;
    exports.assign(exports, fnTyped);
  } else {
    exports.Buf8  = Array;
    exports.Buf16 = Array;
    exports.Buf32 = Array;
    exports.assign(exports, fnUntyped);
  }
};

exports.setTyped(TYPED_OK);

},{}],32:[function(require,module,exports){
// String encode/decode helpers
'use strict';


var utils = require('./common');


// Quick check if we can use fast array to bin string conversion
//
// - apply(Array) can fail on Android 2.2
// - apply(Uint8Array) can fail on iOS 5.1 Safary
//
var STR_APPLY_OK = true;
var STR_APPLY_UIA_OK = true;

try { String.fromCharCode.apply(null, [0]); } catch(__) { STR_APPLY_OK = false; }
try { String.fromCharCode.apply(null, new Uint8Array(1)); } catch(__) { STR_APPLY_UIA_OK = false; }


// Table with utf8 lengths (calculated by first byte of sequence)
// Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
// because max possible codepoint is 0x10ffff
var _utf8len = new utils.Buf8(256);
for (var q=0; q<256; q++) {
  _utf8len[q] = (q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1);
}
_utf8len[254]=_utf8len[254]=1; // Invalid sequence start


// convert string to array (typed, when possible)
exports.string2buf = function (str) {
  var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;

  // count binary size
  for (m_pos = 0; m_pos < str_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 0xfc00) === 0xd800 && (m_pos+1 < str_len)) {
      c2 = str.charCodeAt(m_pos+1);
      if ((c2 & 0xfc00) === 0xdc00) {
        c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        m_pos++;
      }
    }
    buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }

  // allocate buffer
  buf = new utils.Buf8(buf_len);

  // convert
  for (i=0, m_pos = 0; i < buf_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 0xfc00) === 0xd800 && (m_pos+1 < str_len)) {
      c2 = str.charCodeAt(m_pos+1);
      if ((c2 & 0xfc00) === 0xdc00) {
        c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        m_pos++;
      }
    }
    if (c < 0x80) {
      /* one byte */
      buf[i++] = c;
    } else if (c < 0x800) {
      /* two bytes */
      buf[i++] = 0xC0 | (c >>> 6);
      buf[i++] = 0x80 | (c & 0x3f);
    } else if (c < 0x10000) {
      /* three bytes */
      buf[i++] = 0xE0 | (c >>> 12);
      buf[i++] = 0x80 | (c >>> 6 & 0x3f);
      buf[i++] = 0x80 | (c & 0x3f);
    } else {
      /* four bytes */
      buf[i++] = 0xf0 | (c >>> 18);
      buf[i++] = 0x80 | (c >>> 12 & 0x3f);
      buf[i++] = 0x80 | (c >>> 6 & 0x3f);
      buf[i++] = 0x80 | (c & 0x3f);
    }
  }

  return buf;
};

// Helper (used in 2 places)
function buf2binstring(buf, len) {
  // use fallback for big arrays to avoid stack overflow
  if (len < 65537) {
    if ((buf.subarray && STR_APPLY_UIA_OK) || (!buf.subarray && STR_APPLY_OK)) {
      return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
    }
  }

  var result = '';
  for (var i=0; i < len; i++) {
    result += String.fromCharCode(buf[i]);
  }
  return result;
}


// Convert byte array to binary string
exports.buf2binstring = function(buf) {
  return buf2binstring(buf, buf.length);
};


// Convert binary string (typed, when possible)
exports.binstring2buf = function(str) {
  var buf = new utils.Buf8(str.length);
  for (var i=0, len=buf.length; i < len; i++) {
    buf[i] = str.charCodeAt(i);
  }
  return buf;
};


// convert array to string
exports.buf2string = function (buf, max) {
  var i, out, c, c_len;
  var len = max || buf.length;

  // Reserve max possible length (2 words per char)
  // NB: by unknown reasons, Array is significantly faster for
  //     String.fromCharCode.apply than Uint16Array.
  var utf16buf = new Array(len*2);

  for (out=0, i=0; i<len;) {
    c = buf[i++];
    // quick process ascii
    if (c < 0x80) { utf16buf[out++] = c; continue; }

    c_len = _utf8len[c];
    // skip 5 & 6 byte codes
    if (c_len > 4) { utf16buf[out++] = 0xfffd; i += c_len-1; continue; }

    // apply mask on first byte
    c &= c_len === 2 ? 0x1f : c_len === 3 ? 0x0f : 0x07;
    // join the rest
    while (c_len > 1 && i < len) {
      c = (c << 6) | (buf[i++] & 0x3f);
      c_len--;
    }

    // terminated by end of string?
    if (c_len > 1) { utf16buf[out++] = 0xfffd; continue; }

    if (c < 0x10000) {
      utf16buf[out++] = c;
    } else {
      c -= 0x10000;
      utf16buf[out++] = 0xd800 | ((c >> 10) & 0x3ff);
      utf16buf[out++] = 0xdc00 | (c & 0x3ff);
    }
  }

  return buf2binstring(utf16buf, out);
};


// Calculate max possible position in utf8 buffer,
// that will not break sequence. If that's not possible
// - (very small limits) return max size as is.
//
// buf[] - utf8 bytes array
// max   - length limit (mandatory);
exports.utf8border = function(buf, max) {
  var pos;

  max = max || buf.length;
  if (max > buf.length) { max = buf.length; }

  // go back from last position, until start of sequence found
  pos = max-1;
  while (pos >= 0 && (buf[pos] & 0xC0) === 0x80) { pos--; }

  // Fuckup - very small and broken sequence,
  // return max, because we should return something anyway.
  if (pos < 0) { return max; }

  // If we came to start of buffer - that means vuffer is too small,
  // return max too.
  if (pos === 0) { return max; }

  return (pos + _utf8len[buf[pos]] > max) ? pos : max;
};

},{"./common":31}],33:[function(require,module,exports){
'use strict';

// Note: adler32 takes 12% for level 0 and 2% for level 6.
// It doesn't worth to make additional optimizationa as in original.
// Small size is preferable.

function adler32(adler, buf, len, pos) {
  var s1 = (adler & 0xffff) |0,
      s2 = ((adler >>> 16) & 0xffff) |0,
      n = 0;

  while (len !== 0) {
    // Set limit ~ twice less than 5552, to keep
    // s2 in 31-bits, because we force signed ints.
    // in other case %= will fail.
    n = len > 2000 ? 2000 : len;
    len -= n;

    do {
      s1 = (s1 + buf[pos++]) |0;
      s2 = (s2 + s1) |0;
    } while (--n);

    s1 %= 65521;
    s2 %= 65521;
  }

  return (s1 | (s2 << 16)) |0;
}


module.exports = adler32;

},{}],34:[function(require,module,exports){
module.exports = {

  /* Allowed flush values; see deflate() and inflate() below for details */
  Z_NO_FLUSH:         0,
  Z_PARTIAL_FLUSH:    1,
  Z_SYNC_FLUSH:       2,
  Z_FULL_FLUSH:       3,
  Z_FINISH:           4,
  Z_BLOCK:            5,
  Z_TREES:            6,

  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
  Z_OK:               0,
  Z_STREAM_END:       1,
  Z_NEED_DICT:        2,
  Z_ERRNO:           -1,
  Z_STREAM_ERROR:    -2,
  Z_DATA_ERROR:      -3,
  //Z_MEM_ERROR:     -4,
  Z_BUF_ERROR:       -5,
  //Z_VERSION_ERROR: -6,

  /* compression levels */
  Z_NO_COMPRESSION:         0,
  Z_BEST_SPEED:             1,
  Z_BEST_COMPRESSION:       9,
  Z_DEFAULT_COMPRESSION:   -1,


  Z_FILTERED:               1,
  Z_HUFFMAN_ONLY:           2,
  Z_RLE:                    3,
  Z_FIXED:                  4,
  Z_DEFAULT_STRATEGY:       0,

  /* Possible values of the data_type field (though see inflate()) */
  Z_BINARY:                 0,
  Z_TEXT:                   1,
  //Z_ASCII:                1, // = Z_TEXT (deprecated)
  Z_UNKNOWN:                2,

  /* The deflate compression method */
  Z_DEFLATED:               8
  //Z_NULL:                 null // Use -1 or null inline, depending on var type
};

},{}],35:[function(require,module,exports){
'use strict';

// Note: we can't get significant speed boost here.
// So write code to minimize size - no pregenerated tables
// and array tools dependencies.


// Use ordinary array, since untyped makes no boost here
function makeTable() {
  var c, table = [];

  for (var n =0; n < 256; n++) {
    c = n;
    for (var k =0; k < 8; k++) {
      c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }

  return table;
}

// Create table on load. Just 255 signed longs. Not a problem.
var crcTable = makeTable();


function crc32(crc, buf, len, pos) {
  var t = crcTable,
      end = pos + len;

  crc = crc ^ (-1);

  for (var i = pos; i < end; i++) {
    crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
  }

  return (crc ^ (-1)); // >>> 0;
}


module.exports = crc32;

},{}],36:[function(require,module,exports){
'use strict';

var utils   = require('../utils/common');
var trees   = require('./trees');
var adler32 = require('./adler32');
var crc32   = require('./crc32');
var msg   = require('./messages');

/* Public constants ==========================================================*/
/* ===========================================================================*/


/* Allowed flush values; see deflate() and inflate() below for details */
var Z_NO_FLUSH      = 0;
var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
var Z_FULL_FLUSH    = 3;
var Z_FINISH        = 4;
var Z_BLOCK         = 5;
//var Z_TREES         = 6;


/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */
var Z_OK            = 0;
var Z_STREAM_END    = 1;
//var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
var Z_STREAM_ERROR  = -2;
var Z_DATA_ERROR    = -3;
//var Z_MEM_ERROR     = -4;
var Z_BUF_ERROR     = -5;
//var Z_VERSION_ERROR = -6;


/* compression levels */
//var Z_NO_COMPRESSION      = 0;
//var Z_BEST_SPEED          = 1;
//var Z_BEST_COMPRESSION    = 9;
var Z_DEFAULT_COMPRESSION = -1;


var Z_FILTERED            = 1;
var Z_HUFFMAN_ONLY        = 2;
var Z_RLE                 = 3;
var Z_FIXED               = 4;
var Z_DEFAULT_STRATEGY    = 0;

/* Possible values of the data_type field (though see inflate()) */
//var Z_BINARY              = 0;
//var Z_TEXT                = 1;
//var Z_ASCII               = 1; // = Z_TEXT
var Z_UNKNOWN             = 2;


/* The deflate compression method */
var Z_DEFLATED  = 8;

/*============================================================================*/


var MAX_MEM_LEVEL = 9;
/* Maximum value for memLevel in deflateInit2 */
var MAX_WBITS = 15;
/* 32K LZ77 window */
var DEF_MEM_LEVEL = 8;


var LENGTH_CODES  = 29;
/* number of length codes, not counting the special END_BLOCK code */
var LITERALS      = 256;
/* number of literal bytes 0..255 */
var L_CODES       = LITERALS + 1 + LENGTH_CODES;
/* number of Literal or Length codes, including the END_BLOCK code */
var D_CODES       = 30;
/* number of distance codes */
var BL_CODES      = 19;
/* number of codes used to transfer the bit lengths */
var HEAP_SIZE     = 2*L_CODES + 1;
/* maximum heap size */
var MAX_BITS  = 15;
/* All codes must not exceed MAX_BITS bits */

var MIN_MATCH = 3;
var MAX_MATCH = 258;
var MIN_LOOKAHEAD = (MAX_MATCH + MIN_MATCH + 1);

var PRESET_DICT = 0x20;

var INIT_STATE = 42;
var EXTRA_STATE = 69;
var NAME_STATE = 73;
var COMMENT_STATE = 91;
var HCRC_STATE = 103;
var BUSY_STATE = 113;
var FINISH_STATE = 666;

var BS_NEED_MORE      = 1; /* block not completed, need more input or more output */
var BS_BLOCK_DONE     = 2; /* block flush performed */
var BS_FINISH_STARTED = 3; /* finish started, need only more output at next deflate */
var BS_FINISH_DONE    = 4; /* finish done, accept no more input or output */

var OS_CODE = 0x03; // Unix :) . Don't detect, use this default.

function err(strm, errorCode) {
  strm.msg = msg[errorCode];
  return errorCode;
}

function rank(f) {
  return ((f) << 1) - ((f) > 4 ? 9 : 0);
}

function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }


/* =========================================================================
 * Flush as much pending output as possible. All deflate() output goes
 * through this function so some applications may wish to modify it
 * to avoid allocating a large strm->output buffer and copying into it.
 * (See also read_buf()).
 */
function flush_pending(strm) {
  var s = strm.state;

  //_tr_flush_bits(s);
  var len = s.pending;
  if (len > strm.avail_out) {
    len = strm.avail_out;
  }
  if (len === 0) { return; }

  utils.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
  strm.next_out += len;
  s.pending_out += len;
  strm.total_out += len;
  strm.avail_out -= len;
  s.pending -= len;
  if (s.pending === 0) {
    s.pending_out = 0;
  }
}


function flush_block_only (s, last) {
  trees._tr_flush_block(s, (s.block_start >= 0 ? s.block_start : -1), s.strstart - s.block_start, last);
  s.block_start = s.strstart;
  flush_pending(s.strm);
}


function put_byte(s, b) {
  s.pending_buf[s.pending++] = b;
}


/* =========================================================================
 * Put a short in the pending buffer. The 16-bit value is put in MSB order.
 * IN assertion: the stream state is correct and there is enough room in
 * pending_buf.
 */
function putShortMSB(s, b) {
//  put_byte(s, (Byte)(b >> 8));
//  put_byte(s, (Byte)(b & 0xff));
  s.pending_buf[s.pending++] = (b >>> 8) & 0xff;
  s.pending_buf[s.pending++] = b & 0xff;
}


/* ===========================================================================
 * Read a new buffer from the current input stream, update the adler32
 * and total number of bytes read.  All deflate() input goes through
 * this function so some applications may wish to modify it to avoid
 * allocating a large strm->input buffer and copying from it.
 * (See also flush_pending()).
 */
function read_buf(strm, buf, start, size) {
  var len = strm.avail_in;

  if (len > size) { len = size; }
  if (len === 0) { return 0; }

  strm.avail_in -= len;

  utils.arraySet(buf, strm.input, strm.next_in, len, start);
  if (strm.state.wrap === 1) {
    strm.adler = adler32(strm.adler, buf, len, start);
  }

  else if (strm.state.wrap === 2) {
    strm.adler = crc32(strm.adler, buf, len, start);
  }

  strm.next_in += len;
  strm.total_in += len;

  return len;
}


/* ===========================================================================
 * Set match_start to the longest match starting at the given string and
 * return its length. Matches shorter or equal to prev_length are discarded,
 * in which case the result is equal to prev_length and match_start is
 * garbage.
 * IN assertions: cur_match is the head of the hash chain for the current
 *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
 * OUT assertion: the match length is not greater than s->lookahead.
 */
function longest_match(s, cur_match) {
  var chain_length = s.max_chain_length;      /* max hash chain length */
  var scan = s.strstart; /* current string */
  var match;                       /* matched string */
  var len;                           /* length of current match */
  var best_len = s.prev_length;              /* best match length so far */
  var nice_match = s.nice_match;             /* stop if match long enough */
  var limit = (s.strstart > (s.w_size - MIN_LOOKAHEAD)) ?
      s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0/*NIL*/;

  var _win = s.window; // shortcut

  var wmask = s.w_mask;
  var prev  = s.prev;

  /* Stop when cur_match becomes <= limit. To simplify the code,
   * we prevent matches with the string of window index 0.
   */

  var strend = s.strstart + MAX_MATCH;
  var scan_end1  = _win[scan + best_len - 1];
  var scan_end   = _win[scan + best_len];

  /* The code is optimized for HASH_BITS >= 8 and MAX_MATCH-2 multiple of 16.
   * It is easy to get rid of this optimization if necessary.
   */
  // Assert(s->hash_bits >= 8 && MAX_MATCH == 258, "Code too clever");

  /* Do not waste too much time if we already have a good match: */
  if (s.prev_length >= s.good_match) {
    chain_length >>= 2;
  }
  /* Do not look for matches beyond the end of the input. This is necessary
   * to make deflate deterministic.
   */
  if (nice_match > s.lookahead) { nice_match = s.lookahead; }

  // Assert((ulg)s->strstart <= s->window_size-MIN_LOOKAHEAD, "need lookahead");

  do {
    // Assert(cur_match < s->strstart, "no future");
    match = cur_match;

    /* Skip to next match if the match length cannot increase
     * or if the match length is less than 2.  Note that the checks below
     * for insufficient lookahead only occur occasionally for performance
     * reasons.  Therefore uninitialized memory will be accessed, and
     * conditional jumps will be made that depend on those values.
     * However the length of the match is limited to the lookahead, so
     * the output of deflate is not affected by the uninitialized values.
     */

    if (_win[match + best_len]     !== scan_end  ||
        _win[match + best_len - 1] !== scan_end1 ||
        _win[match]                !== _win[scan] ||
        _win[++match]              !== _win[scan + 1]) {
      continue;
    }

    /* The check at best_len-1 can be removed because it will be made
     * again later. (This heuristic is not always a win.)
     * It is not necessary to compare scan[2] and match[2] since they
     * are always equal when the other bytes match, given that
     * the hash keys are equal and that HASH_BITS >= 8.
     */
    scan += 2;
    match++;
    // Assert(*scan == *match, "match[2]?");

    /* We check for insufficient lookahead only every 8th comparison;
     * the 256th check will be made at strstart+258.
     */
    do {
      /*jshint noempty:false*/
    } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             scan < strend);

    // Assert(scan <= s->window+(unsigned)(s->window_size-1), "wild scan");

    len = MAX_MATCH - (strend - scan);
    scan = strend - MAX_MATCH;

    if (len > best_len) {
      s.match_start = cur_match;
      best_len = len;
      if (len >= nice_match) {
        break;
      }
      scan_end1  = _win[scan + best_len - 1];
      scan_end   = _win[scan + best_len];
    }
  } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);

  if (best_len <= s.lookahead) {
    return best_len;
  }
  return s.lookahead;
}


/* ===========================================================================
 * Fill the window when the lookahead becomes insufficient.
 * Updates strstart and lookahead.
 *
 * IN assertion: lookahead < MIN_LOOKAHEAD
 * OUT assertions: strstart <= window_size-MIN_LOOKAHEAD
 *    At least one byte has been read, or avail_in == 0; reads are
 *    performed for at least two bytes (required for the zip translate_eol
 *    option -- not supported here).
 */
function fill_window(s) {
  var _w_size = s.w_size;
  var p, n, m, more, str;

  //Assert(s->lookahead < MIN_LOOKAHEAD, "already enough lookahead");

  do {
    more = s.window_size - s.lookahead - s.strstart;

    // JS ints have 32 bit, block below not needed
    /* Deal with !@#$% 64K limit: */
    //if (sizeof(int) <= 2) {
    //    if (more == 0 && s->strstart == 0 && s->lookahead == 0) {
    //        more = wsize;
    //
    //  } else if (more == (unsigned)(-1)) {
    //        /* Very unlikely, but possible on 16 bit machine if
    //         * strstart == 0 && lookahead == 1 (input done a byte at time)
    //         */
    //        more--;
    //    }
    //}


    /* If the window is almost full and there is insufficient lookahead,
     * move the upper half to the lower one to make room in the upper half.
     */
    if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {

      utils.arraySet(s.window, s.window, _w_size, _w_size, 0);
      s.match_start -= _w_size;
      s.strstart -= _w_size;
      /* we now have strstart >= MAX_DIST */
      s.block_start -= _w_size;

      /* Slide the hash table (could be avoided with 32 bit values
       at the expense of memory usage). We slide even when level == 0
       to keep the hash table consistent if we switch back to level > 0
       later. (Using level 0 permanently is not an optimal usage of
       zlib, so we don't care about this pathological case.)
       */

      n = s.hash_size;
      p = n;
      do {
        m = s.head[--p];
        s.head[p] = (m >= _w_size ? m - _w_size : 0);
      } while (--n);

      n = _w_size;
      p = n;
      do {
        m = s.prev[--p];
        s.prev[p] = (m >= _w_size ? m - _w_size : 0);
        /* If n is not on any hash chain, prev[n] is garbage but
         * its value will never be used.
         */
      } while (--n);

      more += _w_size;
    }
    if (s.strm.avail_in === 0) {
      break;
    }

    /* If there was no sliding:
     *    strstart <= WSIZE+MAX_DIST-1 && lookahead <= MIN_LOOKAHEAD - 1 &&
     *    more == window_size - lookahead - strstart
     * => more >= window_size - (MIN_LOOKAHEAD-1 + WSIZE + MAX_DIST-1)
     * => more >= window_size - 2*WSIZE + 2
     * In the BIG_MEM or MMAP case (not yet supported),
     *   window_size == input_size + MIN_LOOKAHEAD  &&
     *   strstart + s->lookahead <= input_size => more >= MIN_LOOKAHEAD.
     * Otherwise, window_size == 2*WSIZE so more >= 2.
     * If there was sliding, more >= WSIZE. So in all cases, more >= 2.
     */
    //Assert(more >= 2, "more < 2");
    n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
    s.lookahead += n;

    /* Initialize the hash value now that we have some input: */
    if (s.lookahead + s.insert >= MIN_MATCH) {
      str = s.strstart - s.insert;
      s.ins_h = s.window[str];

      /* UPDATE_HASH(s, s->ins_h, s->window[str + 1]); */
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + 1]) & s.hash_mask;
//#if MIN_MATCH != 3
//        Call update_hash() MIN_MATCH-3 more times
//#endif
      while (s.insert) {
        /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + MIN_MATCH-1]) & s.hash_mask;

        s.prev[str & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = str;
        str++;
        s.insert--;
        if (s.lookahead + s.insert < MIN_MATCH) {
          break;
        }
      }
    }
    /* If the whole input has less than MIN_MATCH bytes, ins_h is garbage,
     * but this is not important since only literal bytes will be emitted.
     */

  } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);

  /* If the WIN_INIT bytes after the end of the current data have never been
   * written, then zero those bytes in order to avoid memory check reports of
   * the use of uninitialized (or uninitialised as Julian writes) bytes by
   * the longest match routines.  Update the high water mark for the next
   * time through here.  WIN_INIT is set to MAX_MATCH since the longest match
   * routines allow scanning to strstart + MAX_MATCH, ignoring lookahead.
   */
//  if (s.high_water < s.window_size) {
//    var curr = s.strstart + s.lookahead;
//    var init = 0;
//
//    if (s.high_water < curr) {
//      /* Previous high water mark below current data -- zero WIN_INIT
//       * bytes or up to end of window, whichever is less.
//       */
//      init = s.window_size - curr;
//      if (init > WIN_INIT)
//        init = WIN_INIT;
//      zmemzero(s->window + curr, (unsigned)init);
//      s->high_water = curr + init;
//    }
//    else if (s->high_water < (ulg)curr + WIN_INIT) {
//      /* High water mark at or above current data, but below current data
//       * plus WIN_INIT -- zero out to current data plus WIN_INIT, or up
//       * to end of window, whichever is less.
//       */
//      init = (ulg)curr + WIN_INIT - s->high_water;
//      if (init > s->window_size - s->high_water)
//        init = s->window_size - s->high_water;
//      zmemzero(s->window + s->high_water, (unsigned)init);
//      s->high_water += init;
//    }
//  }
//
//  Assert((ulg)s->strstart <= s->window_size - MIN_LOOKAHEAD,
//    "not enough room for search");
}

/* ===========================================================================
 * Copy without compression as much as possible from the input stream, return
 * the current block state.
 * This function does not insert new strings in the dictionary since
 * uncompressible data is probably not useful. This function is used
 * only for the level=0 compression option.
 * NOTE: this function should be optimized to avoid extra copying from
 * window to pending_buf.
 */
function deflate_stored(s, flush) {
  /* Stored blocks are limited to 0xffff bytes, pending_buf is limited
   * to pending_buf_size, and each stored block has a 5 byte header:
   */
  var max_block_size = 0xffff;

  if (max_block_size > s.pending_buf_size - 5) {
    max_block_size = s.pending_buf_size - 5;
  }

  /* Copy as much as possible from input to output: */
  for (;;) {
    /* Fill the window as much as possible: */
    if (s.lookahead <= 1) {

      //Assert(s->strstart < s->w_size+MAX_DIST(s) ||
      //  s->block_start >= (long)s->w_size, "slide too late");
//      if (!(s.strstart < s.w_size + (s.w_size - MIN_LOOKAHEAD) ||
//        s.block_start >= s.w_size)) {
//        throw  new Error("slide too late");
//      }

      fill_window(s);
      if (s.lookahead === 0 && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }

      if (s.lookahead === 0) {
        break;
      }
      /* flush the current block */
    }
    //Assert(s->block_start >= 0L, "block gone");
//    if (s.block_start < 0) throw new Error("block gone");

    s.strstart += s.lookahead;
    s.lookahead = 0;

    /* Emit a stored block if pending_buf will be full: */
    var max_start = s.block_start + max_block_size;

    if (s.strstart === 0 || s.strstart >= max_start) {
      /* strstart == 0 is possible when wraparound on 16-bit machine */
      s.lookahead = s.strstart - max_start;
      s.strstart = max_start;
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/


    }
    /* Flush if we may have to slide, otherwise block_start may become
     * negative and the data will be gone:
     */
    if (s.strstart - s.block_start >= (s.w_size - MIN_LOOKAHEAD)) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }

  s.insert = 0;

  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }

  if (s.strstart > s.block_start) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }

  return BS_NEED_MORE;
}

/* ===========================================================================
 * Compress as much as possible from the input stream, return the current
 * block state.
 * This function does not perform lazy evaluation of matches and inserts
 * new strings in the dictionary only for unmatched strings or for short
 * matches. It is used only for the fast compression options.
 */
function deflate_fast(s, flush) {
  var hash_head;        /* head of the hash chain */
  var bflush;           /* set if current block must be flushed */

  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break; /* flush the current block */
      }
    }

    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */
    hash_head = 0/*NIL*/;
    if (s.lookahead >= MIN_MATCH) {
      /*** INSERT_STRING(s, s.strstart, hash_head); ***/
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
      /***/
    }

    /* Find the longest match, discarding those <= prev_length.
     * At this point we have always match_length < MIN_MATCH
     */
    if (hash_head !== 0/*NIL*/ && ((s.strstart - hash_head) <= (s.w_size - MIN_LOOKAHEAD))) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */
      s.match_length = longest_match(s, hash_head);
      /* longest_match() sets match_start */
    }
    if (s.match_length >= MIN_MATCH) {
      // check_match(s, s.strstart, s.match_start, s.match_length); // for debug only

      /*** _tr_tally_dist(s, s.strstart - s.match_start,
                     s.match_length - MIN_MATCH, bflush); ***/
      bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);

      s.lookahead -= s.match_length;

      /* Insert new strings in the hash table only if the match length
       * is not too large. This saves time but degrades compression.
       */
      if (s.match_length <= s.max_lazy_match/*max_insert_length*/ && s.lookahead >= MIN_MATCH) {
        s.match_length--; /* string at strstart already in table */
        do {
          s.strstart++;
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
          /* strstart never exceeds WSIZE-MAX_MATCH, so there are
           * always MIN_MATCH bytes ahead.
           */
        } while (--s.match_length !== 0);
        s.strstart++;
      } else
      {
        s.strstart += s.match_length;
        s.match_length = 0;
        s.ins_h = s.window[s.strstart];
        /* UPDATE_HASH(s, s.ins_h, s.window[s.strstart+1]); */
        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + 1]) & s.hash_mask;

//#if MIN_MATCH != 3
//                Call UPDATE_HASH() MIN_MATCH-3 more times
//#endif
        /* If lookahead < MIN_MATCH, ins_h is garbage, but it does not
         * matter since it will be recomputed at next deflate call.
         */
      }
    } else {
      /* No match, output a literal byte */
      //Tracevv((stderr,"%c", s.window[s.strstart]));
      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = ((s.strstart < (MIN_MATCH-1)) ? s.strstart : MIN_MATCH-1);
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* ===========================================================================
 * Same as above, but achieves better compression. We use a lazy
 * evaluation for matches: a match is finally adopted only if there is
 * no better match at the next window position.
 */
function deflate_slow(s, flush) {
  var hash_head;          /* head of hash chain */
  var bflush;              /* set if current block must be flushed */

  var max_insert;

  /* Process the input block. */
  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) { break; } /* flush the current block */
    }

    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */
    hash_head = 0/*NIL*/;
    if (s.lookahead >= MIN_MATCH) {
      /*** INSERT_STRING(s, s.strstart, hash_head); ***/
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
      /***/
    }

    /* Find the longest match, discarding those <= prev_length.
     */
    s.prev_length = s.match_length;
    s.prev_match = s.match_start;
    s.match_length = MIN_MATCH-1;

    if (hash_head !== 0/*NIL*/ && s.prev_length < s.max_lazy_match &&
        s.strstart - hash_head <= (s.w_size-MIN_LOOKAHEAD)/*MAX_DIST(s)*/) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */
      s.match_length = longest_match(s, hash_head);
      /* longest_match() sets match_start */

      if (s.match_length <= 5 &&
         (s.strategy === Z_FILTERED || (s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096/*TOO_FAR*/))) {

        /* If prev_match is also MIN_MATCH, match_start is garbage
         * but we will ignore the current match anyway.
         */
        s.match_length = MIN_MATCH-1;
      }
    }
    /* If there was a match at the previous step and the current
     * match is not better, output the previous match:
     */
    if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
      max_insert = s.strstart + s.lookahead - MIN_MATCH;
      /* Do not insert strings in hash table beyond this. */

      //check_match(s, s.strstart-1, s.prev_match, s.prev_length);

      /***_tr_tally_dist(s, s.strstart - 1 - s.prev_match,
                     s.prev_length - MIN_MATCH, bflush);***/
      bflush = trees._tr_tally(s, s.strstart - 1- s.prev_match, s.prev_length - MIN_MATCH);
      /* Insert in hash table all strings up to the end of the match.
       * strstart-1 and strstart are already inserted. If there is not
       * enough lookahead, the last two strings are not inserted in
       * the hash table.
       */
      s.lookahead -= s.prev_length-1;
      s.prev_length -= 2;
      do {
        if (++s.strstart <= max_insert) {
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
        }
      } while (--s.prev_length !== 0);
      s.match_available = 0;
      s.match_length = MIN_MATCH-1;
      s.strstart++;

      if (bflush) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/
      }

    } else if (s.match_available) {
      /* If there was no match at the previous position, output a
       * single literal. If there was a match but the current match
       * is longer, truncate the previous match to a single literal.
       */
      //Tracevv((stderr,"%c", s->window[s->strstart-1]));
      /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart-1]);

      if (bflush) {
        /*** FLUSH_BLOCK_ONLY(s, 0) ***/
        flush_block_only(s, false);
        /***/
      }
      s.strstart++;
      s.lookahead--;
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    } else {
      /* There is no previous match to compare with, wait for
       * the next step to decide.
       */
      s.match_available = 1;
      s.strstart++;
      s.lookahead--;
    }
  }
  //Assert (flush != Z_NO_FLUSH, "no flush?");
  if (s.match_available) {
    //Tracevv((stderr,"%c", s->window[s->strstart-1]));
    /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
    bflush = trees._tr_tally(s, 0, s.window[s.strstart-1]);

    s.match_available = 0;
  }
  s.insert = s.strstart < MIN_MATCH-1 ? s.strstart : MIN_MATCH-1;
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }

  return BS_BLOCK_DONE;
}


/* ===========================================================================
 * For Z_RLE, simply look for runs of bytes, generate matches only of distance
 * one.  Do not maintain a hash table.  (It will be regenerated if this run of
 * deflate switches away from Z_RLE.)
 */
function deflate_rle(s, flush) {
  var bflush;            /* set if current block must be flushed */
  var prev;              /* byte at distance one to match */
  var scan, strend;      /* scan goes up to strend for length of run */

  var _win = s.window;

  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the longest run, plus one for the unrolled loop.
     */
    if (s.lookahead <= MAX_MATCH) {
      fill_window(s);
      if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) { break; } /* flush the current block */
    }

    /* See how many times the previous byte repeats */
    s.match_length = 0;
    if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
      scan = s.strstart - 1;
      prev = _win[scan];
      if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
        strend = s.strstart + MAX_MATCH;
        do {
          /*jshint noempty:false*/
        } while (prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 scan < strend);
        s.match_length = MAX_MATCH - (strend - scan);
        if (s.match_length > s.lookahead) {
          s.match_length = s.lookahead;
        }
      }
      //Assert(scan <= s->window+(uInt)(s->window_size-1), "wild scan");
    }

    /* Emit match if have run of MIN_MATCH or longer, else emit literal */
    if (s.match_length >= MIN_MATCH) {
      //check_match(s, s.strstart, s.strstart - 1, s.match_length);

      /*** _tr_tally_dist(s, 1, s.match_length - MIN_MATCH, bflush); ***/
      bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);

      s.lookahead -= s.match_length;
      s.strstart += s.match_length;
      s.match_length = 0;
    } else {
      /* No match, output a literal byte */
      //Tracevv((stderr,"%c", s->window[s->strstart]));
      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* ===========================================================================
 * For Z_HUFFMAN_ONLY, do not look for matches.  Do not maintain a hash table.
 * (It will be regenerated if this run of deflate switches away from Huffman.)
 */
function deflate_huff(s, flush) {
  var bflush;             /* set if current block must be flushed */

  for (;;) {
    /* Make sure that we have a literal to write. */
    if (s.lookahead === 0) {
      fill_window(s);
      if (s.lookahead === 0) {
        if (flush === Z_NO_FLUSH) {
          return BS_NEED_MORE;
        }
        break;      /* flush the current block */
      }
    }

    /* Output a literal byte */
    s.match_length = 0;
    //Tracevv((stderr,"%c", s->window[s->strstart]));
    /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
    bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
    s.lookahead--;
    s.strstart++;
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* Values for max_lazy_match, good_match and max_chain_length, depending on
 * the desired pack level (0..9). The values given below have been tuned to
 * exclude worst case performance for pathological files. Better values may be
 * found for specific files.
 */
var Config = function (good_length, max_lazy, nice_length, max_chain, func) {
  this.good_length = good_length;
  this.max_lazy = max_lazy;
  this.nice_length = nice_length;
  this.max_chain = max_chain;
  this.func = func;
};

var configuration_table;

configuration_table = [
  /*      good lazy nice chain */
  new Config(0, 0, 0, 0, deflate_stored),          /* 0 store only */
  new Config(4, 4, 8, 4, deflate_fast),            /* 1 max speed, no lazy matches */
  new Config(4, 5, 16, 8, deflate_fast),           /* 2 */
  new Config(4, 6, 32, 32, deflate_fast),          /* 3 */

  new Config(4, 4, 16, 16, deflate_slow),          /* 4 lazy matches */
  new Config(8, 16, 32, 32, deflate_slow),         /* 5 */
  new Config(8, 16, 128, 128, deflate_slow),       /* 6 */
  new Config(8, 32, 128, 256, deflate_slow),       /* 7 */
  new Config(32, 128, 258, 1024, deflate_slow),    /* 8 */
  new Config(32, 258, 258, 4096, deflate_slow)     /* 9 max compression */
];


/* ===========================================================================
 * Initialize the "longest match" routines for a new zlib stream
 */
function lm_init(s) {
  s.window_size = 2 * s.w_size;

  /*** CLEAR_HASH(s); ***/
  zero(s.head); // Fill with NIL (= 0);

  /* Set the default configuration parameters:
   */
  s.max_lazy_match = configuration_table[s.level].max_lazy;
  s.good_match = configuration_table[s.level].good_length;
  s.nice_match = configuration_table[s.level].nice_length;
  s.max_chain_length = configuration_table[s.level].max_chain;

  s.strstart = 0;
  s.block_start = 0;
  s.lookahead = 0;
  s.insert = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  s.ins_h = 0;
}


function DeflateState() {
  this.strm = null;            /* pointer back to this zlib stream */
  this.status = 0;            /* as the name implies */
  this.pending_buf = null;      /* output still pending */
  this.pending_buf_size = 0;  /* size of pending_buf */
  this.pending_out = 0;       /* next pending byte to output to the stream */
  this.pending = 0;           /* nb of bytes in the pending buffer */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
  this.gzhead = null;         /* gzip header information to write */
  this.gzindex = 0;           /* where in extra, name, or comment */
  this.method = Z_DEFLATED; /* can only be DEFLATED */
  this.last_flush = -1;   /* value of flush param for previous deflate call */

  this.w_size = 0;  /* LZ77 window size (32K by default) */
  this.w_bits = 0;  /* log2(w_size)  (8..16) */
  this.w_mask = 0;  /* w_size - 1 */

  this.window = null;
  /* Sliding window. Input bytes are read into the second half of the window,
   * and move to the first half later to keep a dictionary of at least wSize
   * bytes. With this organization, matches are limited to a distance of
   * wSize-MAX_MATCH bytes, but this ensures that IO is always
   * performed with a length multiple of the block size.
   */

  this.window_size = 0;
  /* Actual size of window: 2*wSize, except when the user input buffer
   * is directly used as sliding window.
   */

  this.prev = null;
  /* Link to older string with same hash index. To limit the size of this
   * array to 64K, this link is maintained only for the last 32K strings.
   * An index in this array is thus a window index modulo 32K.
   */

  this.head = null;   /* Heads of the hash chains or NIL. */

  this.ins_h = 0;       /* hash index of string to be inserted */
  this.hash_size = 0;   /* number of elements in hash table */
  this.hash_bits = 0;   /* log2(hash_size) */
  this.hash_mask = 0;   /* hash_size-1 */

  this.hash_shift = 0;
  /* Number of bits by which ins_h must be shifted at each input
   * step. It must be such that after MIN_MATCH steps, the oldest
   * byte no longer takes part in the hash key, that is:
   *   hash_shift * MIN_MATCH >= hash_bits
   */

  this.block_start = 0;
  /* Window position at the beginning of the current output block. Gets
   * negative when the window is moved backwards.
   */

  this.match_length = 0;      /* length of best match */
  this.prev_match = 0;        /* previous match */
  this.match_available = 0;   /* set if previous match exists */
  this.strstart = 0;          /* start of string to insert */
  this.match_start = 0;       /* start of matching string */
  this.lookahead = 0;         /* number of valid bytes ahead in window */

  this.prev_length = 0;
  /* Length of the best match at previous step. Matches not greater than this
   * are discarded. This is used in the lazy match evaluation.
   */

  this.max_chain_length = 0;
  /* To speed up deflation, hash chains are never searched beyond this
   * length.  A higher limit improves compression ratio but degrades the
   * speed.
   */

  this.max_lazy_match = 0;
  /* Attempt to find a better match only when the current match is strictly
   * smaller than this value. This mechanism is used only for compression
   * levels >= 4.
   */
  // That's alias to max_lazy_match, don't use directly
  //this.max_insert_length = 0;
  /* Insert new strings in the hash table only if the match length is not
   * greater than this length. This saves time but degrades compression.
   * max_insert_length is used only for compression levels <= 3.
   */

  this.level = 0;     /* compression level (1..9) */
  this.strategy = 0;  /* favor or force Huffman coding*/

  this.good_match = 0;
  /* Use a faster search when the previous match is longer than this */

  this.nice_match = 0; /* Stop searching when current match exceeds this */

              /* used by trees.c: */

  /* Didn't use ct_data typedef below to suppress compiler warning */

  // struct ct_data_s dyn_ltree[HEAP_SIZE];   /* literal and length tree */
  // struct ct_data_s dyn_dtree[2*D_CODES+1]; /* distance tree */
  // struct ct_data_s bl_tree[2*BL_CODES+1];  /* Huffman tree for bit lengths */

  // Use flat array of DOUBLE size, with interleaved fata,
  // because JS does not support effective
  this.dyn_ltree  = new utils.Buf16(HEAP_SIZE * 2);
  this.dyn_dtree  = new utils.Buf16((2*D_CODES+1) * 2);
  this.bl_tree    = new utils.Buf16((2*BL_CODES+1) * 2);
  zero(this.dyn_ltree);
  zero(this.dyn_dtree);
  zero(this.bl_tree);

  this.l_desc   = null;         /* desc. for literal tree */
  this.d_desc   = null;         /* desc. for distance tree */
  this.bl_desc  = null;         /* desc. for bit length tree */

  //ush bl_count[MAX_BITS+1];
  this.bl_count = new utils.Buf16(MAX_BITS+1);
  /* number of codes at each bit length for an optimal tree */

  //int heap[2*L_CODES+1];      /* heap used to build the Huffman trees */
  this.heap = new utils.Buf16(2*L_CODES+1);  /* heap used to build the Huffman trees */
  zero(this.heap);

  this.heap_len = 0;               /* number of elements in the heap */
  this.heap_max = 0;               /* element of largest frequency */
  /* The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.
   * The same heap array is used to build all trees.
   */

  this.depth = new utils.Buf16(2*L_CODES+1); //uch depth[2*L_CODES+1];
  zero(this.depth);
  /* Depth of each subtree used as tie breaker for trees of equal frequency
   */

  this.l_buf = 0;          /* buffer index for literals or lengths */

  this.lit_bufsize = 0;
  /* Size of match buffer for literals/lengths.  There are 4 reasons for
   * limiting lit_bufsize to 64K:
   *   - frequencies can be kept in 16 bit counters
   *   - if compression is not successful for the first block, all input
   *     data is still in the window so we can still emit a stored block even
   *     when input comes from standard input.  (This can also be done for
   *     all blocks if lit_bufsize is not greater than 32K.)
   *   - if compression is not successful for a file smaller than 64K, we can
   *     even emit a stored file instead of a stored block (saving 5 bytes).
   *     This is applicable only for zip (not gzip or zlib).
   *   - creating new Huffman trees less frequently may not provide fast
   *     adaptation to changes in the input data statistics. (Take for
   *     example a binary file with poorly compressible code followed by
   *     a highly compressible string table.) Smaller buffer sizes give
   *     fast adaptation but have of course the overhead of transmitting
   *     trees more frequently.
   *   - I can't count above 4
   */

  this.last_lit = 0;      /* running index in l_buf */

  this.d_buf = 0;
  /* Buffer index for distances. To simplify the code, d_buf and l_buf have
   * the same number of elements. To use different lengths, an extra flag
   * array would be necessary.
   */

  this.opt_len = 0;       /* bit length of current block with optimal trees */
  this.static_len = 0;    /* bit length of current block with static trees */
  this.matches = 0;       /* number of string matches in current block */
  this.insert = 0;        /* bytes at end of window left to insert */


  this.bi_buf = 0;
  /* Output buffer. bits are inserted starting at the bottom (least
   * significant bits).
   */
  this.bi_valid = 0;
  /* Number of valid bits in bi_buf.  All bits above the last valid bit
   * are always zero.
   */

  // Used for window memory init. We safely ignore it for JS. That makes
  // sense only for pointers and memory check tools.
  //this.high_water = 0;
  /* High water mark offset in window for initialized bytes -- bytes above
   * this are set to zero in order to avoid memory check warnings when
   * longest match routines access bytes past the input.  This is then
   * updated to the new high water mark.
   */
}


function deflateResetKeep(strm) {
  var s;

  if (!strm || !strm.state) {
    return err(strm, Z_STREAM_ERROR);
  }

  strm.total_in = strm.total_out = 0;
  strm.data_type = Z_UNKNOWN;

  s = strm.state;
  s.pending = 0;
  s.pending_out = 0;

  if (s.wrap < 0) {
    s.wrap = -s.wrap;
    /* was made negative by deflate(..., Z_FINISH); */
  }
  s.status = (s.wrap ? INIT_STATE : BUSY_STATE);
  strm.adler = (s.wrap === 2) ?
    0  // crc32(0, Z_NULL, 0)
  :
    1; // adler32(0, Z_NULL, 0)
  s.last_flush = Z_NO_FLUSH;
  trees._tr_init(s);
  return Z_OK;
}


function deflateReset(strm) {
  var ret = deflateResetKeep(strm);
  if (ret === Z_OK) {
    lm_init(strm.state);
  }
  return ret;
}


function deflateSetHeader(strm, head) {
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  if (strm.state.wrap !== 2) { return Z_STREAM_ERROR; }
  strm.state.gzhead = head;
  return Z_OK;
}


function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
  if (!strm) { // === Z_NULL
    return Z_STREAM_ERROR;
  }
  var wrap = 1;

  if (level === Z_DEFAULT_COMPRESSION) {
    level = 6;
  }

  if (windowBits < 0) { /* suppress zlib wrapper */
    wrap = 0;
    windowBits = -windowBits;
  }

  else if (windowBits > 15) {
    wrap = 2;           /* write gzip wrapper instead */
    windowBits -= 16;
  }


  if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED ||
    windowBits < 8 || windowBits > 15 || level < 0 || level > 9 ||
    strategy < 0 || strategy > Z_FIXED) {
    return err(strm, Z_STREAM_ERROR);
  }


  if (windowBits === 8) {
    windowBits = 9;
  }
  /* until 256-byte window bug fixed */

  var s = new DeflateState();

  strm.state = s;
  s.strm = strm;

  s.wrap = wrap;
  s.gzhead = null;
  s.w_bits = windowBits;
  s.w_size = 1 << s.w_bits;
  s.w_mask = s.w_size - 1;

  s.hash_bits = memLevel + 7;
  s.hash_size = 1 << s.hash_bits;
  s.hash_mask = s.hash_size - 1;
  s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);

  s.window = new utils.Buf8(s.w_size * 2);
  s.head = new utils.Buf16(s.hash_size);
  s.prev = new utils.Buf16(s.w_size);

  // Don't need mem init magic for JS.
  //s.high_water = 0;  /* nothing written to s->window yet */

  s.lit_bufsize = 1 << (memLevel + 6); /* 16K elements by default */

  s.pending_buf_size = s.lit_bufsize * 4;
  s.pending_buf = new utils.Buf8(s.pending_buf_size);

  s.d_buf = s.lit_bufsize >> 1;
  s.l_buf = (1 + 2) * s.lit_bufsize;

  s.level = level;
  s.strategy = strategy;
  s.method = method;

  return deflateReset(strm);
}

function deflateInit(strm, level) {
  return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
}


function deflate(strm, flush) {
  var old_flush, s;
  var beg, val; // for gzip header write only

  if (!strm || !strm.state ||
    flush > Z_BLOCK || flush < 0) {
    return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
  }

  s = strm.state;

  if (!strm.output ||
      (!strm.input && strm.avail_in !== 0) ||
      (s.status === FINISH_STATE && flush !== Z_FINISH)) {
    return err(strm, (strm.avail_out === 0) ? Z_BUF_ERROR : Z_STREAM_ERROR);
  }

  s.strm = strm; /* just in case */
  old_flush = s.last_flush;
  s.last_flush = flush;

  /* Write the header */
  if (s.status === INIT_STATE) {

    if (s.wrap === 2) { // GZIP header
      strm.adler = 0;  //crc32(0L, Z_NULL, 0);
      put_byte(s, 31);
      put_byte(s, 139);
      put_byte(s, 8);
      if (!s.gzhead) { // s->gzhead == Z_NULL
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, s.level === 9 ? 2 :
                    (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                     4 : 0));
        put_byte(s, OS_CODE);
        s.status = BUSY_STATE;
      }
      else {
        put_byte(s, (s.gzhead.text ? 1 : 0) +
                    (s.gzhead.hcrc ? 2 : 0) +
                    (!s.gzhead.extra ? 0 : 4) +
                    (!s.gzhead.name ? 0 : 8) +
                    (!s.gzhead.comment ? 0 : 16)
                );
        put_byte(s, s.gzhead.time & 0xff);
        put_byte(s, (s.gzhead.time >> 8) & 0xff);
        put_byte(s, (s.gzhead.time >> 16) & 0xff);
        put_byte(s, (s.gzhead.time >> 24) & 0xff);
        put_byte(s, s.level === 9 ? 2 :
                    (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                     4 : 0));
        put_byte(s, s.gzhead.os & 0xff);
        if (s.gzhead.extra && s.gzhead.extra.length) {
          put_byte(s, s.gzhead.extra.length & 0xff);
          put_byte(s, (s.gzhead.extra.length >> 8) & 0xff);
        }
        if (s.gzhead.hcrc) {
          strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
        }
        s.gzindex = 0;
        s.status = EXTRA_STATE;
      }
    }
    else // DEFLATE header
    {
      var header = (Z_DEFLATED + ((s.w_bits - 8) << 4)) << 8;
      var level_flags = -1;

      if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
        level_flags = 0;
      } else if (s.level < 6) {
        level_flags = 1;
      } else if (s.level === 6) {
        level_flags = 2;
      } else {
        level_flags = 3;
      }
      header |= (level_flags << 6);
      if (s.strstart !== 0) { header |= PRESET_DICT; }
      header += 31 - (header % 31);

      s.status = BUSY_STATE;
      putShortMSB(s, header);

      /* Save the adler32 of the preset dictionary: */
      if (s.strstart !== 0) {
        putShortMSB(s, strm.adler >>> 16);
        putShortMSB(s, strm.adler & 0xffff);
      }
      strm.adler = 1; // adler32(0L, Z_NULL, 0);
    }
  }

//#ifdef GZIP
  if (s.status === EXTRA_STATE) {
    if (s.gzhead.extra/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */

      while (s.gzindex < (s.gzhead.extra.length & 0xffff)) {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            break;
          }
        }
        put_byte(s, s.gzhead.extra[s.gzindex] & 0xff);
        s.gzindex++;
      }
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (s.gzindex === s.gzhead.extra.length) {
        s.gzindex = 0;
        s.status = NAME_STATE;
      }
    }
    else {
      s.status = NAME_STATE;
    }
  }
  if (s.status === NAME_STATE) {
    if (s.gzhead.name/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */
      //int val;

      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            val = 1;
            break;
          }
        }
        // JS specific: little magic to add zero terminator to end of string
        if (s.gzindex < s.gzhead.name.length) {
          val = s.gzhead.name.charCodeAt(s.gzindex++) & 0xff;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);

      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) {
        s.gzindex = 0;
        s.status = COMMENT_STATE;
      }
    }
    else {
      s.status = COMMENT_STATE;
    }
  }
  if (s.status === COMMENT_STATE) {
    if (s.gzhead.comment/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */
      //int val;

      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            val = 1;
            break;
          }
        }
        // JS specific: little magic to add zero terminator to end of string
        if (s.gzindex < s.gzhead.comment.length) {
          val = s.gzhead.comment.charCodeAt(s.gzindex++) & 0xff;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);

      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) {
        s.status = HCRC_STATE;
      }
    }
    else {
      s.status = HCRC_STATE;
    }
  }
  if (s.status === HCRC_STATE) {
    if (s.gzhead.hcrc) {
      if (s.pending + 2 > s.pending_buf_size) {
        flush_pending(strm);
      }
      if (s.pending + 2 <= s.pending_buf_size) {
        put_byte(s, strm.adler & 0xff);
        put_byte(s, (strm.adler >> 8) & 0xff);
        strm.adler = 0; //crc32(0L, Z_NULL, 0);
        s.status = BUSY_STATE;
      }
    }
    else {
      s.status = BUSY_STATE;
    }
  }
//#endif

  /* Flush as much pending output as possible */
  if (s.pending !== 0) {
    flush_pending(strm);
    if (strm.avail_out === 0) {
      /* Since avail_out is 0, deflate will be called again with
       * more output space, but possibly with both pending and
       * avail_in equal to zero. There won't be anything to do,
       * but this is not an error situation so make sure we
       * return OK instead of BUF_ERROR at next call of deflate:
       */
      s.last_flush = -1;
      return Z_OK;
    }

    /* Make sure there is something to do and avoid duplicate consecutive
     * flushes. For repeated and useless calls with Z_FINISH, we keep
     * returning Z_STREAM_END instead of Z_BUF_ERROR.
     */
  } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) &&
    flush !== Z_FINISH) {
    return err(strm, Z_BUF_ERROR);
  }

  /* User must not provide more input after the first FINISH: */
  if (s.status === FINISH_STATE && strm.avail_in !== 0) {
    return err(strm, Z_BUF_ERROR);
  }

  /* Start a new block or continue the current one.
   */
  if (strm.avail_in !== 0 || s.lookahead !== 0 ||
    (flush !== Z_NO_FLUSH && s.status !== FINISH_STATE)) {
    var bstate = (s.strategy === Z_HUFFMAN_ONLY) ? deflate_huff(s, flush) :
      (s.strategy === Z_RLE ? deflate_rle(s, flush) :
        configuration_table[s.level].func(s, flush));

    if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
      s.status = FINISH_STATE;
    }
    if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
      if (strm.avail_out === 0) {
        s.last_flush = -1;
        /* avoid BUF_ERROR next call, see above */
      }
      return Z_OK;
      /* If flush != Z_NO_FLUSH && avail_out == 0, the next call
       * of deflate should use the same flush parameter to make sure
       * that the flush is complete. So we don't have to output an
       * empty block here, this will be done at next call. This also
       * ensures that for a very small output buffer, we emit at most
       * one empty block.
       */
    }
    if (bstate === BS_BLOCK_DONE) {
      if (flush === Z_PARTIAL_FLUSH) {
        trees._tr_align(s);
      }
      else if (flush !== Z_BLOCK) { /* FULL_FLUSH or SYNC_FLUSH */

        trees._tr_stored_block(s, 0, 0, false);
        /* For a full flush, this empty block will be recognized
         * as a special marker by inflate_sync().
         */
        if (flush === Z_FULL_FLUSH) {
          /*** CLEAR_HASH(s); ***/             /* forget history */
          zero(s.head); // Fill with NIL (= 0);

          if (s.lookahead === 0) {
            s.strstart = 0;
            s.block_start = 0;
            s.insert = 0;
          }
        }
      }
      flush_pending(strm);
      if (strm.avail_out === 0) {
        s.last_flush = -1; /* avoid BUF_ERROR at next call, see above */
        return Z_OK;
      }
    }
  }
  //Assert(strm->avail_out > 0, "bug2");
  //if (strm.avail_out <= 0) { throw new Error("bug2");}

  if (flush !== Z_FINISH) { return Z_OK; }
  if (s.wrap <= 0) { return Z_STREAM_END; }

  /* Write the trailer */
  if (s.wrap === 2) {
    put_byte(s, strm.adler & 0xff);
    put_byte(s, (strm.adler >> 8) & 0xff);
    put_byte(s, (strm.adler >> 16) & 0xff);
    put_byte(s, (strm.adler >> 24) & 0xff);
    put_byte(s, strm.total_in & 0xff);
    put_byte(s, (strm.total_in >> 8) & 0xff);
    put_byte(s, (strm.total_in >> 16) & 0xff);
    put_byte(s, (strm.total_in >> 24) & 0xff);
  }
  else
  {
    putShortMSB(s, strm.adler >>> 16);
    putShortMSB(s, strm.adler & 0xffff);
  }

  flush_pending(strm);
  /* If avail_out is zero, the application will call deflate again
   * to flush the rest.
   */
  if (s.wrap > 0) { s.wrap = -s.wrap; }
  /* write the trailer only once! */
  return s.pending !== 0 ? Z_OK : Z_STREAM_END;
}

function deflateEnd(strm) {
  var status;

  if (!strm/*== Z_NULL*/ || !strm.state/*== Z_NULL*/) {
    return Z_STREAM_ERROR;
  }

  status = strm.state.status;
  if (status !== INIT_STATE &&
    status !== EXTRA_STATE &&
    status !== NAME_STATE &&
    status !== COMMENT_STATE &&
    status !== HCRC_STATE &&
    status !== BUSY_STATE &&
    status !== FINISH_STATE
  ) {
    return err(strm, Z_STREAM_ERROR);
  }

  strm.state = null;

  return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
}

/* =========================================================================
 * Copy the source state to the destination state
 */
//function deflateCopy(dest, source) {
//
//}

exports.deflateInit = deflateInit;
exports.deflateInit2 = deflateInit2;
exports.deflateReset = deflateReset;
exports.deflateResetKeep = deflateResetKeep;
exports.deflateSetHeader = deflateSetHeader;
exports.deflate = deflate;
exports.deflateEnd = deflateEnd;
exports.deflateInfo = 'pako deflate (from Nodeca project)';

/* Not implemented
exports.deflateBound = deflateBound;
exports.deflateCopy = deflateCopy;
exports.deflateSetDictionary = deflateSetDictionary;
exports.deflateParams = deflateParams;
exports.deflatePending = deflatePending;
exports.deflatePrime = deflatePrime;
exports.deflateTune = deflateTune;
*/

},{"../utils/common":31,"./adler32":33,"./crc32":35,"./messages":41,"./trees":42}],37:[function(require,module,exports){
'use strict';


function GZheader() {
  /* true if compressed data believed to be text */
  this.text       = 0;
  /* modification time */
  this.time       = 0;
  /* extra flags (not used when writing a gzip file) */
  this.xflags     = 0;
  /* operating system */
  this.os         = 0;
  /* pointer to extra field or Z_NULL if none */
  this.extra      = null;
  /* extra field length (valid if extra != Z_NULL) */
  this.extra_len  = 0; // Actually, we don't need it in JS,
                       // but leave for few code modifications

  //
  // Setup limits is not necessary because in js we should not preallocate memory
  // for inflate use constant limit in 65536 bytes
  //

  /* space at extra (only when reading header) */
  // this.extra_max  = 0;
  /* pointer to zero-terminated file name or Z_NULL */
  this.name       = '';
  /* space at name (only when reading header) */
  // this.name_max   = 0;
  /* pointer to zero-terminated comment or Z_NULL */
  this.comment    = '';
  /* space at comment (only when reading header) */
  // this.comm_max   = 0;
  /* true if there was or will be a header crc */
  this.hcrc       = 0;
  /* true when done reading gzip header (not used when writing a gzip file) */
  this.done       = false;
}

module.exports = GZheader;

},{}],38:[function(require,module,exports){
'use strict';

// See state defs from inflate.js
var BAD = 30;       /* got a data error -- remain here until reset */
var TYPE = 12;      /* i: waiting for type bits, including last-flag bit */

/*
   Decode literal, length, and distance codes and write out the resulting
   literal and match bytes until either not enough input or output is
   available, an end-of-block is encountered, or a data error is encountered.
   When large enough input and output buffers are supplied to inflate(), for
   example, a 16K input buffer and a 64K output buffer, more than 95% of the
   inflate execution time is spent in this routine.

   Entry assumptions:

        state.mode === LEN
        strm.avail_in >= 6
        strm.avail_out >= 258
        start >= strm.avail_out
        state.bits < 8

   On return, state.mode is one of:

        LEN -- ran out of enough output space or enough available input
        TYPE -- reached end of block code, inflate() to interpret next block
        BAD -- error in block data

   Notes:

    - The maximum input bits used by a length/distance pair is 15 bits for the
      length code, 5 bits for the length extra, 15 bits for the distance code,
      and 13 bits for the distance extra.  This totals 48 bits, or six bytes.
      Therefore if strm.avail_in >= 6, then there is enough input to avoid
      checking for available input while decoding.

    - The maximum bytes that a single length/distance pair can output is 258
      bytes, which is the maximum length that can be coded.  inflate_fast()
      requires strm.avail_out >= 258 for each loop to avoid checking for
      output space.
 */
module.exports = function inflate_fast(strm, start) {
  var state;
  var _in;                    /* local strm.input */
  var last;                   /* have enough input while in < last */
  var _out;                   /* local strm.output */
  var beg;                    /* inflate()'s initial strm.output */
  var end;                    /* while out < end, enough space available */
//#ifdef INFLATE_STRICT
  var dmax;                   /* maximum distance from zlib header */
//#endif
  var wsize;                  /* window size or zero if not using window */
  var whave;                  /* valid bytes in the window */
  var wnext;                  /* window write index */
  var window;                 /* allocated sliding window, if wsize != 0 */
  var hold;                   /* local strm.hold */
  var bits;                   /* local strm.bits */
  var lcode;                  /* local strm.lencode */
  var dcode;                  /* local strm.distcode */
  var lmask;                  /* mask for first level of length codes */
  var dmask;                  /* mask for first level of distance codes */
  var here;                   /* retrieved table entry */
  var op;                     /* code bits, operation, extra bits, or */
                              /*  window position, window bytes to copy */
  var len;                    /* match length, unused bytes */
  var dist;                   /* match distance */
  var from;                   /* where to copy match from */
  var from_source;


  var input, output; // JS specific, because we have no pointers

  /* copy state to local variables */
  state = strm.state;
  //here = state.here;
  _in = strm.next_in;
  input = strm.input;
  last = _in + (strm.avail_in - 5);
  _out = strm.next_out;
  output = strm.output;
  beg = _out - (start - strm.avail_out);
  end = _out + (strm.avail_out - 257);
//#ifdef INFLATE_STRICT
  dmax = state.dmax;
//#endif
  wsize = state.wsize;
  whave = state.whave;
  wnext = state.wnext;
  window = state.window;
  hold = state.hold;
  bits = state.bits;
  lcode = state.lencode;
  dcode = state.distcode;
  lmask = (1 << state.lenbits) - 1;
  dmask = (1 << state.distbits) - 1;


  /* decode literals and length/distances until end-of-block or not enough
     input data or output space */

  top:
  do {
    if (bits < 15) {
      hold += input[_in++] << bits;
      bits += 8;
      hold += input[_in++] << bits;
      bits += 8;
    }

    here = lcode[hold & lmask];

    dolen:
    for (;;) { // Goto emulation
      op = here >>> 24/*here.bits*/;
      hold >>>= op;
      bits -= op;
      op = (here >>> 16) & 0xff/*here.op*/;
      if (op === 0) {                          /* literal */
        //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
        //        "inflate:         literal '%c'\n" :
        //        "inflate:         literal 0x%02x\n", here.val));
        output[_out++] = here & 0xffff/*here.val*/;
      }
      else if (op & 16) {                     /* length base */
        len = here & 0xffff/*here.val*/;
        op &= 15;                           /* number of extra bits */
        if (op) {
          if (bits < op) {
            hold += input[_in++] << bits;
            bits += 8;
          }
          len += hold & ((1 << op) - 1);
          hold >>>= op;
          bits -= op;
        }
        //Tracevv((stderr, "inflate:         length %u\n", len));
        if (bits < 15) {
          hold += input[_in++] << bits;
          bits += 8;
          hold += input[_in++] << bits;
          bits += 8;
        }
        here = dcode[hold & dmask];

        dodist:
        for (;;) { // goto emulation
          op = here >>> 24/*here.bits*/;
          hold >>>= op;
          bits -= op;
          op = (here >>> 16) & 0xff/*here.op*/;

          if (op & 16) {                      /* distance base */
            dist = here & 0xffff/*here.val*/;
            op &= 15;                       /* number of extra bits */
            if (bits < op) {
              hold += input[_in++] << bits;
              bits += 8;
              if (bits < op) {
                hold += input[_in++] << bits;
                bits += 8;
              }
            }
            dist += hold & ((1 << op) - 1);
//#ifdef INFLATE_STRICT
            if (dist > dmax) {
              strm.msg = 'invalid distance too far back';
              state.mode = BAD;
              break top;
            }
//#endif
            hold >>>= op;
            bits -= op;
            //Tracevv((stderr, "inflate:         distance %u\n", dist));
            op = _out - beg;                /* max distance in output */
            if (dist > op) {                /* see if copy from window */
              op = dist - op;               /* distance back in window */
              if (op > whave) {
                if (state.sane) {
                  strm.msg = 'invalid distance too far back';
                  state.mode = BAD;
                  break top;
                }

// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//                if (len <= op - whave) {
//                  do {
//                    output[_out++] = 0;
//                  } while (--len);
//                  continue top;
//                }
//                len -= op - whave;
//                do {
//                  output[_out++] = 0;
//                } while (--op > whave);
//                if (op === 0) {
//                  from = _out - dist;
//                  do {
//                    output[_out++] = output[from++];
//                  } while (--len);
//                  continue top;
//                }
//#endif
              }
              from = 0; // window index
              from_source = window;
              if (wnext === 0) {           /* very common case */
                from += wsize - op;
                if (op < len) {         /* some from window */
                  len -= op;
                  do {
                    output[_out++] = window[from++];
                  } while (--op);
                  from = _out - dist;  /* rest from output */
                  from_source = output;
                }
              }
              else if (wnext < op) {      /* wrap around window */
                from += wsize + wnext - op;
                op -= wnext;
                if (op < len) {         /* some from end of window */
                  len -= op;
                  do {
                    output[_out++] = window[from++];
                  } while (--op);
                  from = 0;
                  if (wnext < len) {  /* some from start of window */
                    op = wnext;
                    len -= op;
                    do {
                      output[_out++] = window[from++];
                    } while (--op);
                    from = _out - dist;      /* rest from output */
                    from_source = output;
                  }
                }
              }
              else {                      /* contiguous in window */
                from += wnext - op;
                if (op < len) {         /* some from window */
                  len -= op;
                  do {
                    output[_out++] = window[from++];
                  } while (--op);
                  from = _out - dist;  /* rest from output */
                  from_source = output;
                }
              }
              while (len > 2) {
                output[_out++] = from_source[from++];
                output[_out++] = from_source[from++];
                output[_out++] = from_source[from++];
                len -= 3;
              }
              if (len) {
                output[_out++] = from_source[from++];
                if (len > 1) {
                  output[_out++] = from_source[from++];
                }
              }
            }
            else {
              from = _out - dist;          /* copy direct from output */
              do {                        /* minimum length is three */
                output[_out++] = output[from++];
                output[_out++] = output[from++];
                output[_out++] = output[from++];
                len -= 3;
              } while (len > 2);
              if (len) {
                output[_out++] = output[from++];
                if (len > 1) {
                  output[_out++] = output[from++];
                }
              }
            }
          }
          else if ((op & 64) === 0) {          /* 2nd level distance code */
            here = dcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
            continue dodist;
          }
          else {
            strm.msg = 'invalid distance code';
            state.mode = BAD;
            break top;
          }

          break; // need to emulate goto via "continue"
        }
      }
      else if ((op & 64) === 0) {              /* 2nd level length code */
        here = lcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
        continue dolen;
      }
      else if (op & 32) {                     /* end-of-block */
        //Tracevv((stderr, "inflate:         end of block\n"));
        state.mode = TYPE;
        break top;
      }
      else {
        strm.msg = 'invalid literal/length code';
        state.mode = BAD;
        break top;
      }

      break; // need to emulate goto via "continue"
    }
  } while (_in < last && _out < end);

  /* return unused bytes (on entry, bits < 8, so in won't go too far back) */
  len = bits >> 3;
  _in -= len;
  bits -= len << 3;
  hold &= (1 << bits) - 1;

  /* update state and return */
  strm.next_in = _in;
  strm.next_out = _out;
  strm.avail_in = (_in < last ? 5 + (last - _in) : 5 - (_in - last));
  strm.avail_out = (_out < end ? 257 + (end - _out) : 257 - (_out - end));
  state.hold = hold;
  state.bits = bits;
  return;
};

},{}],39:[function(require,module,exports){
'use strict';


var utils = require('../utils/common');
var adler32 = require('./adler32');
var crc32   = require('./crc32');
var inflate_fast = require('./inffast');
var inflate_table = require('./inftrees');

var CODES = 0;
var LENS = 1;
var DISTS = 2;

/* Public constants ==========================================================*/
/* ===========================================================================*/


/* Allowed flush values; see deflate() and inflate() below for details */
//var Z_NO_FLUSH      = 0;
//var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
//var Z_FULL_FLUSH    = 3;
var Z_FINISH        = 4;
var Z_BLOCK         = 5;
var Z_TREES         = 6;


/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */
var Z_OK            = 0;
var Z_STREAM_END    = 1;
var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
var Z_STREAM_ERROR  = -2;
var Z_DATA_ERROR    = -3;
var Z_MEM_ERROR     = -4;
var Z_BUF_ERROR     = -5;
//var Z_VERSION_ERROR = -6;

/* The deflate compression method */
var Z_DEFLATED  = 8;


/* STATES ====================================================================*/
/* ===========================================================================*/


var    HEAD = 1;       /* i: waiting for magic header */
var    FLAGS = 2;      /* i: waiting for method and flags (gzip) */
var    TIME = 3;       /* i: waiting for modification time (gzip) */
var    OS = 4;         /* i: waiting for extra flags and operating system (gzip) */
var    EXLEN = 5;      /* i: waiting for extra length (gzip) */
var    EXTRA = 6;      /* i: waiting for extra bytes (gzip) */
var    NAME = 7;       /* i: waiting for end of file name (gzip) */
var    COMMENT = 8;    /* i: waiting for end of comment (gzip) */
var    HCRC = 9;       /* i: waiting for header crc (gzip) */
var    DICTID = 10;    /* i: waiting for dictionary check value */
var    DICT = 11;      /* waiting for inflateSetDictionary() call */
var        TYPE = 12;      /* i: waiting for type bits, including last-flag bit */
var        TYPEDO = 13;    /* i: same, but skip check to exit inflate on new block */
var        STORED = 14;    /* i: waiting for stored size (length and complement) */
var        COPY_ = 15;     /* i/o: same as COPY below, but only first time in */
var        COPY = 16;      /* i/o: waiting for input or output to copy stored block */
var        TABLE = 17;     /* i: waiting for dynamic block table lengths */
var        LENLENS = 18;   /* i: waiting for code length code lengths */
var        CODELENS = 19;  /* i: waiting for length/lit and distance code lengths */
var            LEN_ = 20;      /* i: same as LEN below, but only first time in */
var            LEN = 21;       /* i: waiting for length/lit/eob code */
var            LENEXT = 22;    /* i: waiting for length extra bits */
var            DIST = 23;      /* i: waiting for distance code */
var            DISTEXT = 24;   /* i: waiting for distance extra bits */
var            MATCH = 25;     /* o: waiting for output space to copy string */
var            LIT = 26;       /* o: waiting for output space to write literal */
var    CHECK = 27;     /* i: waiting for 32-bit check value */
var    LENGTH = 28;    /* i: waiting for 32-bit length (gzip) */
var    DONE = 29;      /* finished check, done -- remain here until reset */
var    BAD = 30;       /* got a data error -- remain here until reset */
var    MEM = 31;       /* got an inflate() memory error -- remain here until reset */
var    SYNC = 32;      /* looking for synchronization bytes to restart inflate() */

/* ===========================================================================*/



var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
//var ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);

var MAX_WBITS = 15;
/* 32K LZ77 window */
var DEF_WBITS = MAX_WBITS;


function ZSWAP32(q) {
  return  (((q >>> 24) & 0xff) +
          ((q >>> 8) & 0xff00) +
          ((q & 0xff00) << 8) +
          ((q & 0xff) << 24));
}


function InflateState() {
  this.mode = 0;             /* current inflate mode */
  this.last = false;          /* true if processing last block */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
  this.havedict = false;      /* true if dictionary provided */
  this.flags = 0;             /* gzip header method and flags (0 if zlib) */
  this.dmax = 0;              /* zlib header max distance (INFLATE_STRICT) */
  this.check = 0;             /* protected copy of check value */
  this.total = 0;             /* protected copy of output count */
  // TODO: may be {}
  this.head = null;           /* where to save gzip header information */

  /* sliding window */
  this.wbits = 0;             /* log base 2 of requested window size */
  this.wsize = 0;             /* window size or zero if not using window */
  this.whave = 0;             /* valid bytes in the window */
  this.wnext = 0;             /* window write index */
  this.window = null;         /* allocated sliding window, if needed */

  /* bit accumulator */
  this.hold = 0;              /* input bit accumulator */
  this.bits = 0;              /* number of bits in "in" */

  /* for string and stored block copying */
  this.length = 0;            /* literal or length of data to copy */
  this.offset = 0;            /* distance back to copy string from */

  /* for table and code decoding */
  this.extra = 0;             /* extra bits needed */

  /* fixed and dynamic code tables */
  this.lencode = null;          /* starting table for length/literal codes */
  this.distcode = null;         /* starting table for distance codes */
  this.lenbits = 0;           /* index bits for lencode */
  this.distbits = 0;          /* index bits for distcode */

  /* dynamic table building */
  this.ncode = 0;             /* number of code length code lengths */
  this.nlen = 0;              /* number of length code lengths */
  this.ndist = 0;             /* number of distance code lengths */
  this.have = 0;              /* number of code lengths in lens[] */
  this.next = null;              /* next available space in codes[] */

  this.lens = new utils.Buf16(320); /* temporary storage for code lengths */
  this.work = new utils.Buf16(288); /* work area for code table building */

  /*
   because we don't have pointers in js, we use lencode and distcode directly
   as buffers so we don't need codes
  */
  //this.codes = new utils.Buf32(ENOUGH);       /* space for code tables */
  this.lendyn = null;              /* dynamic table for length/literal codes (JS specific) */
  this.distdyn = null;             /* dynamic table for distance codes (JS specific) */
  this.sane = 0;                   /* if false, allow invalid distance too far */
  this.back = 0;                   /* bits back of last unprocessed length/lit */
  this.was = 0;                    /* initial length of match */
}

function inflateResetKeep(strm) {
  var state;

  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  strm.total_in = strm.total_out = state.total = 0;
  strm.msg = ''; /*Z_NULL*/
  if (state.wrap) {       /* to support ill-conceived Java test suite */
    strm.adler = state.wrap & 1;
  }
  state.mode = HEAD;
  state.last = 0;
  state.havedict = 0;
  state.dmax = 32768;
  state.head = null/*Z_NULL*/;
  state.hold = 0;
  state.bits = 0;
  //state.lencode = state.distcode = state.next = state.codes;
  state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
  state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);

  state.sane = 1;
  state.back = -1;
  //Tracev((stderr, "inflate: reset\n"));
  return Z_OK;
}

function inflateReset(strm) {
  var state;

  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  state.wsize = 0;
  state.whave = 0;
  state.wnext = 0;
  return inflateResetKeep(strm);

}

function inflateReset2(strm, windowBits) {
  var wrap;
  var state;

  /* get the state */
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;

  /* extract wrap request from windowBits parameter */
  if (windowBits < 0) {
    wrap = 0;
    windowBits = -windowBits;
  }
  else {
    wrap = (windowBits >> 4) + 1;
    if (windowBits < 48) {
      windowBits &= 15;
    }
  }

  /* set number of window bits, free window if different */
  if (windowBits && (windowBits < 8 || windowBits > 15)) {
    return Z_STREAM_ERROR;
  }
  if (state.window !== null && state.wbits !== windowBits) {
    state.window = null;
  }

  /* update state and reset the rest of it */
  state.wrap = wrap;
  state.wbits = windowBits;
  return inflateReset(strm);
}

function inflateInit2(strm, windowBits) {
  var ret;
  var state;

  if (!strm) { return Z_STREAM_ERROR; }
  //strm.msg = Z_NULL;                 /* in case we return an error */

  state = new InflateState();

  //if (state === Z_NULL) return Z_MEM_ERROR;
  //Tracev((stderr, "inflate: allocated\n"));
  strm.state = state;
  state.window = null/*Z_NULL*/;
  ret = inflateReset2(strm, windowBits);
  if (ret !== Z_OK) {
    strm.state = null/*Z_NULL*/;
  }
  return ret;
}

function inflateInit(strm) {
  return inflateInit2(strm, DEF_WBITS);
}


/*
 Return state with length and distance decoding tables and index sizes set to
 fixed code decoding.  Normally this returns fixed tables from inffixed.h.
 If BUILDFIXED is defined, then instead this routine builds the tables the
 first time it's called, and returns those tables the first time and
 thereafter.  This reduces the size of the code by about 2K bytes, in
 exchange for a little execution time.  However, BUILDFIXED should not be
 used for threaded applications, since the rewriting of the tables and virgin
 may not be thread-safe.
 */
var virgin = true;

var lenfix, distfix; // We have no pointers in JS, so keep tables separate

function fixedtables(state) {
  /* build fixed huffman tables if first call (may not be thread safe) */
  if (virgin) {
    var sym;

    lenfix = new utils.Buf32(512);
    distfix = new utils.Buf32(32);

    /* literal/length table */
    sym = 0;
    while (sym < 144) { state.lens[sym++] = 8; }
    while (sym < 256) { state.lens[sym++] = 9; }
    while (sym < 280) { state.lens[sym++] = 7; }
    while (sym < 288) { state.lens[sym++] = 8; }

    inflate_table(LENS,  state.lens, 0, 288, lenfix,   0, state.work, {bits: 9});

    /* distance table */
    sym = 0;
    while (sym < 32) { state.lens[sym++] = 5; }

    inflate_table(DISTS, state.lens, 0, 32,   distfix, 0, state.work, {bits: 5});

    /* do this just once */
    virgin = false;
  }

  state.lencode = lenfix;
  state.lenbits = 9;
  state.distcode = distfix;
  state.distbits = 5;
}


/*
 Update the window with the last wsize (normally 32K) bytes written before
 returning.  If window does not exist yet, create it.  This is only called
 when a window is already in use, or when output has been written during this
 inflate call, but the end of the deflate stream has not been reached yet.
 It is also called to create a window for dictionary data when a dictionary
 is loaded.

 Providing output buffers larger than 32K to inflate() should provide a speed
 advantage, since only the last 32K of output is copied to the sliding window
 upon return from inflate(), and since all distances after the first 32K of
 output will fall in the output data, making match copies simpler and faster.
 The advantage may be dependent on the size of the processor's data caches.
 */
function updatewindow(strm, src, end, copy) {
  var dist;
  var state = strm.state;

  /* if it hasn't been done already, allocate space for the window */
  if (state.window === null) {
    state.wsize = 1 << state.wbits;
    state.wnext = 0;
    state.whave = 0;

    state.window = new utils.Buf8(state.wsize);
  }

  /* copy state->wsize or less output bytes into the circular window */
  if (copy >= state.wsize) {
    utils.arraySet(state.window,src, end - state.wsize, state.wsize, 0);
    state.wnext = 0;
    state.whave = state.wsize;
  }
  else {
    dist = state.wsize - state.wnext;
    if (dist > copy) {
      dist = copy;
    }
    //zmemcpy(state->window + state->wnext, end - copy, dist);
    utils.arraySet(state.window,src, end - copy, dist, state.wnext);
    copy -= dist;
    if (copy) {
      //zmemcpy(state->window, end - copy, copy);
      utils.arraySet(state.window,src, end - copy, copy, 0);
      state.wnext = copy;
      state.whave = state.wsize;
    }
    else {
      state.wnext += dist;
      if (state.wnext === state.wsize) { state.wnext = 0; }
      if (state.whave < state.wsize) { state.whave += dist; }
    }
  }
  return 0;
}

function inflate(strm, flush) {
  var state;
  var input, output;          // input/output buffers
  var next;                   /* next input INDEX */
  var put;                    /* next output INDEX */
  var have, left;             /* available input and output */
  var hold;                   /* bit buffer */
  var bits;                   /* bits in bit buffer */
  var _in, _out;              /* save starting available input and output */
  var copy;                   /* number of stored or match bytes to copy */
  var from;                   /* where to copy match bytes from */
  var from_source;
  var here = 0;               /* current decoding table entry */
  var here_bits, here_op, here_val; // paked "here" denormalized (JS specific)
  //var last;                   /* parent table entry */
  var last_bits, last_op, last_val; // paked "last" denormalized (JS specific)
  var len;                    /* length to copy for repeats, bits to drop */
  var ret;                    /* return code */
  var hbuf = new utils.Buf8(4);    /* buffer for gzip header crc calculation */
  var opts;

  var n; // temporary var for NEED_BITS

  var order = /* permutation of code lengths */
    [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];


  if (!strm || !strm.state || !strm.output ||
      (!strm.input && strm.avail_in !== 0)) {
    return Z_STREAM_ERROR;
  }

  state = strm.state;
  if (state.mode === TYPE) { state.mode = TYPEDO; }    /* skip check */


  //--- LOAD() ---
  put = strm.next_out;
  output = strm.output;
  left = strm.avail_out;
  next = strm.next_in;
  input = strm.input;
  have = strm.avail_in;
  hold = state.hold;
  bits = state.bits;
  //---

  _in = have;
  _out = left;
  ret = Z_OK;

  inf_leave: // goto emulation
  for (;;) {
    switch (state.mode) {
    case HEAD:
      if (state.wrap === 0) {
        state.mode = TYPEDO;
        break;
      }
      //=== NEEDBITS(16);
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if ((state.wrap & 2) && hold === 0x8b1f) {  /* gzip header */
        state.check = 0/*crc32(0L, Z_NULL, 0)*/;
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//

        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        state.mode = FLAGS;
        break;
      }
      state.flags = 0;           /* expect zlib header */
      if (state.head) {
        state.head.done = false;
      }
      if (!(state.wrap & 1) ||   /* check if zlib header allowed */
        (((hold & 0xff)/*BITS(8)*/ << 8) + (hold >> 8)) % 31) {
        strm.msg = 'incorrect header check';
        state.mode = BAD;
        break;
      }
      if ((hold & 0x0f)/*BITS(4)*/ !== Z_DEFLATED) {
        strm.msg = 'unknown compression method';
        state.mode = BAD;
        break;
      }
      //--- DROPBITS(4) ---//
      hold >>>= 4;
      bits -= 4;
      //---//
      len = (hold & 0x0f)/*BITS(4)*/ + 8;
      if (state.wbits === 0) {
        state.wbits = len;
      }
      else if (len > state.wbits) {
        strm.msg = 'invalid window size';
        state.mode = BAD;
        break;
      }
      state.dmax = 1 << len;
      //Tracev((stderr, "inflate:   zlib header ok\n"));
      strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
      state.mode = hold & 0x200 ? DICTID : TYPE;
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      break;
    case FLAGS:
      //=== NEEDBITS(16); */
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.flags = hold;
      if ((state.flags & 0xff) !== Z_DEFLATED) {
        strm.msg = 'unknown compression method';
        state.mode = BAD;
        break;
      }
      if (state.flags & 0xe000) {
        strm.msg = 'unknown header flags set';
        state.mode = BAD;
        break;
      }
      if (state.head) {
        state.head.text = ((hold >> 8) & 1);
      }
      if (state.flags & 0x0200) {
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = TIME;
      /* falls through */
    case TIME:
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if (state.head) {
        state.head.time = hold;
      }
      if (state.flags & 0x0200) {
        //=== CRC4(state.check, hold)
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        hbuf[2] = (hold >>> 16) & 0xff;
        hbuf[3] = (hold >>> 24) & 0xff;
        state.check = crc32(state.check, hbuf, 4, 0);
        //===
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = OS;
      /* falls through */
    case OS:
      //=== NEEDBITS(16); */
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if (state.head) {
        state.head.xflags = (hold & 0xff);
        state.head.os = (hold >> 8);
      }
      if (state.flags & 0x0200) {
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = EXLEN;
      /* falls through */
    case EXLEN:
      if (state.flags & 0x0400) {
        //=== NEEDBITS(16); */
        while (bits < 16) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.length = hold;
        if (state.head) {
          state.head.extra_len = hold;
        }
        if (state.flags & 0x0200) {
          //=== CRC2(state.check, hold);
          hbuf[0] = hold & 0xff;
          hbuf[1] = (hold >>> 8) & 0xff;
          state.check = crc32(state.check, hbuf, 2, 0);
          //===//
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
      }
      else if (state.head) {
        state.head.extra = null/*Z_NULL*/;
      }
      state.mode = EXTRA;
      /* falls through */
    case EXTRA:
      if (state.flags & 0x0400) {
        copy = state.length;
        if (copy > have) { copy = have; }
        if (copy) {
          if (state.head) {
            len = state.head.extra_len - state.length;
            if (!state.head.extra) {
              // Use untyped array for more conveniend processing later
              state.head.extra = new Array(state.head.extra_len);
            }
            utils.arraySet(
              state.head.extra,
              input,
              next,
              // extra field is limited to 65536 bytes
              // - no need for additional size check
              copy,
              /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
              len
            );
            //zmemcpy(state.head.extra + len, next,
            //        len + copy > state.head.extra_max ?
            //        state.head.extra_max - len : copy);
          }
          if (state.flags & 0x0200) {
            state.check = crc32(state.check, input, copy, next);
          }
          have -= copy;
          next += copy;
          state.length -= copy;
        }
        if (state.length) { break inf_leave; }
      }
      state.length = 0;
      state.mode = NAME;
      /* falls through */
    case NAME:
      if (state.flags & 0x0800) {
        if (have === 0) { break inf_leave; }
        copy = 0;
        do {
          // TODO: 2 or 1 bytes?
          len = input[next + copy++];
          /* use constant limit because in js we should not preallocate memory */
          if (state.head && len &&
              (state.length < 65536 /*state.head.name_max*/)) {
            state.head.name += String.fromCharCode(len);
          }
        } while (len && copy < have);

        if (state.flags & 0x0200) {
          state.check = crc32(state.check, input, copy, next);
        }
        have -= copy;
        next += copy;
        if (len) { break inf_leave; }
      }
      else if (state.head) {
        state.head.name = null;
      }
      state.length = 0;
      state.mode = COMMENT;
      /* falls through */
    case COMMENT:
      if (state.flags & 0x1000) {
        if (have === 0) { break inf_leave; }
        copy = 0;
        do {
          len = input[next + copy++];
          /* use constant limit because in js we should not preallocate memory */
          if (state.head && len &&
              (state.length < 65536 /*state.head.comm_max*/)) {
            state.head.comment += String.fromCharCode(len);
          }
        } while (len && copy < have);
        if (state.flags & 0x0200) {
          state.check = crc32(state.check, input, copy, next);
        }
        have -= copy;
        next += copy;
        if (len) { break inf_leave; }
      }
      else if (state.head) {
        state.head.comment = null;
      }
      state.mode = HCRC;
      /* falls through */
    case HCRC:
      if (state.flags & 0x0200) {
        //=== NEEDBITS(16); */
        while (bits < 16) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if (hold !== (state.check & 0xffff)) {
          strm.msg = 'header crc mismatch';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
      }
      if (state.head) {
        state.head.hcrc = ((state.flags >> 9) & 1);
        state.head.done = true;
      }
      strm.adler = state.check = 0 /*crc32(0L, Z_NULL, 0)*/;
      state.mode = TYPE;
      break;
    case DICTID:
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      strm.adler = state.check = ZSWAP32(hold);
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = DICT;
      /* falls through */
    case DICT:
      if (state.havedict === 0) {
        //--- RESTORE() ---
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        //---
        return Z_NEED_DICT;
      }
      strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
      state.mode = TYPE;
      /* falls through */
    case TYPE:
      if (flush === Z_BLOCK || flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case TYPEDO:
      if (state.last) {
        //--- BYTEBITS() ---//
        hold >>>= bits & 7;
        bits -= bits & 7;
        //---//
        state.mode = CHECK;
        break;
      }
      //=== NEEDBITS(3); */
      while (bits < 3) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.last = (hold & 0x01)/*BITS(1)*/;
      //--- DROPBITS(1) ---//
      hold >>>= 1;
      bits -= 1;
      //---//

      switch ((hold & 0x03)/*BITS(2)*/) {
      case 0:                             /* stored block */
        //Tracev((stderr, "inflate:     stored block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = STORED;
        break;
      case 1:                             /* fixed block */
        fixedtables(state);
        //Tracev((stderr, "inflate:     fixed codes block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = LEN_;             /* decode codes */
        if (flush === Z_TREES) {
          //--- DROPBITS(2) ---//
          hold >>>= 2;
          bits -= 2;
          //---//
          break inf_leave;
        }
        break;
      case 2:                             /* dynamic block */
        //Tracev((stderr, "inflate:     dynamic codes block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = TABLE;
        break;
      case 3:
        strm.msg = 'invalid block type';
        state.mode = BAD;
      }
      //--- DROPBITS(2) ---//
      hold >>>= 2;
      bits -= 2;
      //---//
      break;
    case STORED:
      //--- BYTEBITS() ---// /* go to byte boundary */
      hold >>>= bits & 7;
      bits -= bits & 7;
      //---//
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if ((hold & 0xffff) !== ((hold >>> 16) ^ 0xffff)) {
        strm.msg = 'invalid stored block lengths';
        state.mode = BAD;
        break;
      }
      state.length = hold & 0xffff;
      //Tracev((stderr, "inflate:       stored length %u\n",
      //        state.length));
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = COPY_;
      if (flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case COPY_:
      state.mode = COPY;
      /* falls through */
    case COPY:
      copy = state.length;
      if (copy) {
        if (copy > have) { copy = have; }
        if (copy > left) { copy = left; }
        if (copy === 0) { break inf_leave; }
        //--- zmemcpy(put, next, copy); ---
        utils.arraySet(output, input, next, copy, put);
        //---//
        have -= copy;
        next += copy;
        left -= copy;
        put += copy;
        state.length -= copy;
        break;
      }
      //Tracev((stderr, "inflate:       stored end\n"));
      state.mode = TYPE;
      break;
    case TABLE:
      //=== NEEDBITS(14); */
      while (bits < 14) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.nlen = (hold & 0x1f)/*BITS(5)*/ + 257;
      //--- DROPBITS(5) ---//
      hold >>>= 5;
      bits -= 5;
      //---//
      state.ndist = (hold & 0x1f)/*BITS(5)*/ + 1;
      //--- DROPBITS(5) ---//
      hold >>>= 5;
      bits -= 5;
      //---//
      state.ncode = (hold & 0x0f)/*BITS(4)*/ + 4;
      //--- DROPBITS(4) ---//
      hold >>>= 4;
      bits -= 4;
      //---//
//#ifndef PKZIP_BUG_WORKAROUND
      if (state.nlen > 286 || state.ndist > 30) {
        strm.msg = 'too many length or distance symbols';
        state.mode = BAD;
        break;
      }
//#endif
      //Tracev((stderr, "inflate:       table sizes ok\n"));
      state.have = 0;
      state.mode = LENLENS;
      /* falls through */
    case LENLENS:
      while (state.have < state.ncode) {
        //=== NEEDBITS(3);
        while (bits < 3) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.lens[order[state.have++]] = (hold & 0x07);//BITS(3);
        //--- DROPBITS(3) ---//
        hold >>>= 3;
        bits -= 3;
        //---//
      }
      while (state.have < 19) {
        state.lens[order[state.have++]] = 0;
      }
      // We have separate tables & no pointers. 2 commented lines below not needed.
      //state.next = state.codes;
      //state.lencode = state.next;
      // Switch to use dynamic table
      state.lencode = state.lendyn;
      state.lenbits = 7;

      opts = {bits: state.lenbits};
      ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
      state.lenbits = opts.bits;

      if (ret) {
        strm.msg = 'invalid code lengths set';
        state.mode = BAD;
        break;
      }
      //Tracev((stderr, "inflate:       code lengths ok\n"));
      state.have = 0;
      state.mode = CODELENS;
      /* falls through */
    case CODELENS:
      while (state.have < state.nlen + state.ndist) {
        for (;;) {
          here = state.lencode[hold & ((1 << state.lenbits) - 1)];/*BITS(state.lenbits)*/
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        if (here_val < 16) {
          //--- DROPBITS(here.bits) ---//
          hold >>>= here_bits;
          bits -= here_bits;
          //---//
          state.lens[state.have++] = here_val;
        }
        else {
          if (here_val === 16) {
            //=== NEEDBITS(here.bits + 2);
            n = here_bits + 2;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            if (state.have === 0) {
              strm.msg = 'invalid bit length repeat';
              state.mode = BAD;
              break;
            }
            len = state.lens[state.have - 1];
            copy = 3 + (hold & 0x03);//BITS(2);
            //--- DROPBITS(2) ---//
            hold >>>= 2;
            bits -= 2;
            //---//
          }
          else if (here_val === 17) {
            //=== NEEDBITS(here.bits + 3);
            n = here_bits + 3;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            len = 0;
            copy = 3 + (hold & 0x07);//BITS(3);
            //--- DROPBITS(3) ---//
            hold >>>= 3;
            bits -= 3;
            //---//
          }
          else {
            //=== NEEDBITS(here.bits + 7);
            n = here_bits + 7;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            len = 0;
            copy = 11 + (hold & 0x7f);//BITS(7);
            //--- DROPBITS(7) ---//
            hold >>>= 7;
            bits -= 7;
            //---//
          }
          if (state.have + copy > state.nlen + state.ndist) {
            strm.msg = 'invalid bit length repeat';
            state.mode = BAD;
            break;
          }
          while (copy--) {
            state.lens[state.have++] = len;
          }
        }
      }

      /* handle error breaks in while */
      if (state.mode === BAD) { break; }

      /* check for end-of-block code (better have one) */
      if (state.lens[256] === 0) {
        strm.msg = 'invalid code -- missing end-of-block';
        state.mode = BAD;
        break;
      }

      /* build code tables -- note: do not change the lenbits or distbits
         values here (9 and 6) without reading the comments in inftrees.h
         concerning the ENOUGH constants, which depend on those values */
      state.lenbits = 9;

      opts = {bits: state.lenbits};
      ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
      // We have separate tables & no pointers. 2 commented lines below not needed.
      // state.next_index = opts.table_index;
      state.lenbits = opts.bits;
      // state.lencode = state.next;

      if (ret) {
        strm.msg = 'invalid literal/lengths set';
        state.mode = BAD;
        break;
      }

      state.distbits = 6;
      //state.distcode.copy(state.codes);
      // Switch to use dynamic table
      state.distcode = state.distdyn;
      opts = {bits: state.distbits};
      ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
      // We have separate tables & no pointers. 2 commented lines below not needed.
      // state.next_index = opts.table_index;
      state.distbits = opts.bits;
      // state.distcode = state.next;

      if (ret) {
        strm.msg = 'invalid distances set';
        state.mode = BAD;
        break;
      }
      //Tracev((stderr, 'inflate:       codes ok\n'));
      state.mode = LEN_;
      if (flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case LEN_:
      state.mode = LEN;
      /* falls through */
    case LEN:
      if (have >= 6 && left >= 258) {
        //--- RESTORE() ---
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        //---
        inflate_fast(strm, _out);
        //--- LOAD() ---
        put = strm.next_out;
        output = strm.output;
        left = strm.avail_out;
        next = strm.next_in;
        input = strm.input;
        have = strm.avail_in;
        hold = state.hold;
        bits = state.bits;
        //---

        if (state.mode === TYPE) {
          state.back = -1;
        }
        break;
      }
      state.back = 0;
      for (;;) {
        here = state.lencode[hold & ((1 << state.lenbits) -1)];  /*BITS(state.lenbits)*/
        here_bits = here >>> 24;
        here_op = (here >>> 16) & 0xff;
        here_val = here & 0xffff;

        if (here_bits <= bits) { break; }
        //--- PULLBYTE() ---//
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
        //---//
      }
      if (here_op && (here_op & 0xf0) === 0) {
        last_bits = here_bits;
        last_op = here_op;
        last_val = here_val;
        for (;;) {
          here = state.lencode[last_val +
                  ((hold & ((1 << (last_bits + last_op)) -1))/*BITS(last.bits + last.op)*/ >> last_bits)];
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((last_bits + here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        //--- DROPBITS(last.bits) ---//
        hold >>>= last_bits;
        bits -= last_bits;
        //---//
        state.back += last_bits;
      }
      //--- DROPBITS(here.bits) ---//
      hold >>>= here_bits;
      bits -= here_bits;
      //---//
      state.back += here_bits;
      state.length = here_val;
      if (here_op === 0) {
        //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
        //        "inflate:         literal '%c'\n" :
        //        "inflate:         literal 0x%02x\n", here.val));
        state.mode = LIT;
        break;
      }
      if (here_op & 32) {
        //Tracevv((stderr, "inflate:         end of block\n"));
        state.back = -1;
        state.mode = TYPE;
        break;
      }
      if (here_op & 64) {
        strm.msg = 'invalid literal/length code';
        state.mode = BAD;
        break;
      }
      state.extra = here_op & 15;
      state.mode = LENEXT;
      /* falls through */
    case LENEXT:
      if (state.extra) {
        //=== NEEDBITS(state.extra);
        n = state.extra;
        while (bits < n) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.length += hold & ((1 << state.extra) -1)/*BITS(state.extra)*/;
        //--- DROPBITS(state.extra) ---//
        hold >>>= state.extra;
        bits -= state.extra;
        //---//
        state.back += state.extra;
      }
      //Tracevv((stderr, "inflate:         length %u\n", state.length));
      state.was = state.length;
      state.mode = DIST;
      /* falls through */
    case DIST:
      for (;;) {
        here = state.distcode[hold & ((1 << state.distbits) -1)];/*BITS(state.distbits)*/
        here_bits = here >>> 24;
        here_op = (here >>> 16) & 0xff;
        here_val = here & 0xffff;

        if ((here_bits) <= bits) { break; }
        //--- PULLBYTE() ---//
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
        //---//
      }
      if ((here_op & 0xf0) === 0) {
        last_bits = here_bits;
        last_op = here_op;
        last_val = here_val;
        for (;;) {
          here = state.distcode[last_val +
                  ((hold & ((1 << (last_bits + last_op)) -1))/*BITS(last.bits + last.op)*/ >> last_bits)];
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((last_bits + here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        //--- DROPBITS(last.bits) ---//
        hold >>>= last_bits;
        bits -= last_bits;
        //---//
        state.back += last_bits;
      }
      //--- DROPBITS(here.bits) ---//
      hold >>>= here_bits;
      bits -= here_bits;
      //---//
      state.back += here_bits;
      if (here_op & 64) {
        strm.msg = 'invalid distance code';
        state.mode = BAD;
        break;
      }
      state.offset = here_val;
      state.extra = (here_op) & 15;
      state.mode = DISTEXT;
      /* falls through */
    case DISTEXT:
      if (state.extra) {
        //=== NEEDBITS(state.extra);
        n = state.extra;
        while (bits < n) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.offset += hold & ((1 << state.extra) -1)/*BITS(state.extra)*/;
        //--- DROPBITS(state.extra) ---//
        hold >>>= state.extra;
        bits -= state.extra;
        //---//
        state.back += state.extra;
      }
//#ifdef INFLATE_STRICT
      if (state.offset > state.dmax) {
        strm.msg = 'invalid distance too far back';
        state.mode = BAD;
        break;
      }
//#endif
      //Tracevv((stderr, "inflate:         distance %u\n", state.offset));
      state.mode = MATCH;
      /* falls through */
    case MATCH:
      if (left === 0) { break inf_leave; }
      copy = _out - left;
      if (state.offset > copy) {         /* copy from window */
        copy = state.offset - copy;
        if (copy > state.whave) {
          if (state.sane) {
            strm.msg = 'invalid distance too far back';
            state.mode = BAD;
            break;
          }
// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//          Trace((stderr, "inflate.c too far\n"));
//          copy -= state.whave;
//          if (copy > state.length) { copy = state.length; }
//          if (copy > left) { copy = left; }
//          left -= copy;
//          state.length -= copy;
//          do {
//            output[put++] = 0;
//          } while (--copy);
//          if (state.length === 0) { state.mode = LEN; }
//          break;
//#endif
        }
        if (copy > state.wnext) {
          copy -= state.wnext;
          from = state.wsize - copy;
        }
        else {
          from = state.wnext - copy;
        }
        if (copy > state.length) { copy = state.length; }
        from_source = state.window;
      }
      else {                              /* copy from output */
        from_source = output;
        from = put - state.offset;
        copy = state.length;
      }
      if (copy > left) { copy = left; }
      left -= copy;
      state.length -= copy;
      do {
        output[put++] = from_source[from++];
      } while (--copy);
      if (state.length === 0) { state.mode = LEN; }
      break;
    case LIT:
      if (left === 0) { break inf_leave; }
      output[put++] = state.length;
      left--;
      state.mode = LEN;
      break;
    case CHECK:
      if (state.wrap) {
        //=== NEEDBITS(32);
        while (bits < 32) {
          if (have === 0) { break inf_leave; }
          have--;
          // Use '|' insdead of '+' to make sure that result is signed
          hold |= input[next++] << bits;
          bits += 8;
        }
        //===//
        _out -= left;
        strm.total_out += _out;
        state.total += _out;
        if (_out) {
          strm.adler = state.check =
              /*UPDATE(state.check, put - _out, _out);*/
              (state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out));

        }
        _out = left;
        // NB: crc32 stored as signed 32-bit int, ZSWAP32 returns signed too
        if ((state.flags ? hold : ZSWAP32(hold)) !== state.check) {
          strm.msg = 'incorrect data check';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        //Tracev((stderr, "inflate:   check matches trailer\n"));
      }
      state.mode = LENGTH;
      /* falls through */
    case LENGTH:
      if (state.wrap && state.flags) {
        //=== NEEDBITS(32);
        while (bits < 32) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if (hold !== (state.total & 0xffffffff)) {
          strm.msg = 'incorrect length check';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        //Tracev((stderr, "inflate:   length matches trailer\n"));
      }
      state.mode = DONE;
      /* falls through */
    case DONE:
      ret = Z_STREAM_END;
      break inf_leave;
    case BAD:
      ret = Z_DATA_ERROR;
      break inf_leave;
    case MEM:
      return Z_MEM_ERROR;
    case SYNC:
      /* falls through */
    default:
      return Z_STREAM_ERROR;
    }
  }

  // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"

  /*
     Return from inflate(), updating the total counts and the check value.
     If there was no progress during the inflate() call, return a buffer
     error.  Call updatewindow() to create and/or update the window state.
     Note: a memory error from inflate() is non-recoverable.
   */

  //--- RESTORE() ---
  strm.next_out = put;
  strm.avail_out = left;
  strm.next_in = next;
  strm.avail_in = have;
  state.hold = hold;
  state.bits = bits;
  //---

  if (state.wsize || (_out !== strm.avail_out && state.mode < BAD &&
                      (state.mode < CHECK || flush !== Z_FINISH))) {
    if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
      state.mode = MEM;
      return Z_MEM_ERROR;
    }
  }
  _in -= strm.avail_in;
  _out -= strm.avail_out;
  strm.total_in += _in;
  strm.total_out += _out;
  state.total += _out;
  if (state.wrap && _out) {
    strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
      (state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out));
  }
  strm.data_type = state.bits + (state.last ? 64 : 0) +
                    (state.mode === TYPE ? 128 : 0) +
                    (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
  if (((_in === 0 && _out === 0) || flush === Z_FINISH) && ret === Z_OK) {
    ret = Z_BUF_ERROR;
  }
  return ret;
}

function inflateEnd(strm) {

  if (!strm || !strm.state /*|| strm->zfree == (free_func)0*/) {
    return Z_STREAM_ERROR;
  }

  var state = strm.state;
  if (state.window) {
    state.window = null;
  }
  strm.state = null;
  return Z_OK;
}

function inflateGetHeader(strm, head) {
  var state;

  /* check state */
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  if ((state.wrap & 2) === 0) { return Z_STREAM_ERROR; }

  /* save header structure */
  state.head = head;
  head.done = false;
  return Z_OK;
}


exports.inflateReset = inflateReset;
exports.inflateReset2 = inflateReset2;
exports.inflateResetKeep = inflateResetKeep;
exports.inflateInit = inflateInit;
exports.inflateInit2 = inflateInit2;
exports.inflate = inflate;
exports.inflateEnd = inflateEnd;
exports.inflateGetHeader = inflateGetHeader;
exports.inflateInfo = 'pako inflate (from Nodeca project)';

/* Not implemented
exports.inflateCopy = inflateCopy;
exports.inflateGetDictionary = inflateGetDictionary;
exports.inflateMark = inflateMark;
exports.inflatePrime = inflatePrime;
exports.inflateSetDictionary = inflateSetDictionary;
exports.inflateSync = inflateSync;
exports.inflateSyncPoint = inflateSyncPoint;
exports.inflateUndermine = inflateUndermine;
*/

},{"../utils/common":31,"./adler32":33,"./crc32":35,"./inffast":38,"./inftrees":40}],40:[function(require,module,exports){
'use strict';


var utils = require('../utils/common');

var MAXBITS = 15;
var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
//var ENOUGH = (ENOUGH_LENS+ENOUGH_DISTS);

var CODES = 0;
var LENS = 1;
var DISTS = 2;

var lbase = [ /* Length codes 257..285 base */
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
  35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
];

var lext = [ /* Length codes 257..285 extra */
  16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18,
  19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78
];

var dbase = [ /* Distance codes 0..29 base */
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
  257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
  8193, 12289, 16385, 24577, 0, 0
];

var dext = [ /* Distance codes 0..29 extra */
  16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22,
  23, 23, 24, 24, 25, 25, 26, 26, 27, 27,
  28, 28, 29, 29, 64, 64
];

module.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts)
{
  var bits = opts.bits;
      //here = opts.here; /* table entry for duplication */

  var len = 0;               /* a code's length in bits */
  var sym = 0;               /* index of code symbols */
  var min = 0, max = 0;          /* minimum and maximum code lengths */
  var root = 0;              /* number of index bits for root table */
  var curr = 0;              /* number of index bits for current table */
  var drop = 0;              /* code bits to drop for sub-table */
  var left = 0;                   /* number of prefix codes available */
  var used = 0;              /* code entries in table used */
  var huff = 0;              /* Huffman code */
  var incr;              /* for incrementing code, index */
  var fill;              /* index for replicating entries */
  var low;               /* low bits for current root entry */
  var mask;              /* mask for low root bits */
  var next;             /* next available space in table */
  var base = null;     /* base value table to use */
  var base_index = 0;
//  var shoextra;    /* extra bits table to use */
  var end;                    /* use base and extra for symbol > end */
  var count = new utils.Buf16(MAXBITS+1); //[MAXBITS+1];    /* number of codes of each length */
  var offs = new utils.Buf16(MAXBITS+1); //[MAXBITS+1];     /* offsets in table for each length */
  var extra = null;
  var extra_index = 0;

  var here_bits, here_op, here_val;

  /*
   Process a set of code lengths to create a canonical Huffman code.  The
   code lengths are lens[0..codes-1].  Each length corresponds to the
   symbols 0..codes-1.  The Huffman code is generated by first sorting the
   symbols by length from short to long, and retaining the symbol order
   for codes with equal lengths.  Then the code starts with all zero bits
   for the first code of the shortest length, and the codes are integer
   increments for the same length, and zeros are appended as the length
   increases.  For the deflate format, these bits are stored backwards
   from their more natural integer increment ordering, and so when the
   decoding tables are built in the large loop below, the integer codes
   are incremented backwards.

   This routine assumes, but does not check, that all of the entries in
   lens[] are in the range 0..MAXBITS.  The caller must assure this.
   1..MAXBITS is interpreted as that code length.  zero means that that
   symbol does not occur in this code.

   The codes are sorted by computing a count of codes for each length,
   creating from that a table of starting indices for each length in the
   sorted table, and then entering the symbols in order in the sorted
   table.  The sorted table is work[], with that space being provided by
   the caller.

   The length counts are used for other purposes as well, i.e. finding
   the minimum and maximum length codes, determining if there are any
   codes at all, checking for a valid set of lengths, and looking ahead
   at length counts to determine sub-table sizes when building the
   decoding tables.
   */

  /* accumulate lengths for codes (assumes lens[] all in 0..MAXBITS) */
  for (len = 0; len <= MAXBITS; len++) {
    count[len] = 0;
  }
  for (sym = 0; sym < codes; sym++) {
    count[lens[lens_index + sym]]++;
  }

  /* bound code lengths, force root to be within code lengths */
  root = bits;
  for (max = MAXBITS; max >= 1; max--) {
    if (count[max] !== 0) { break; }
  }
  if (root > max) {
    root = max;
  }
  if (max === 0) {                     /* no symbols to code at all */
    //table.op[opts.table_index] = 64;  //here.op = (var char)64;    /* invalid code marker */
    //table.bits[opts.table_index] = 1;   //here.bits = (var char)1;
    //table.val[opts.table_index++] = 0;   //here.val = (var short)0;
    table[table_index++] = (1 << 24) | (64 << 16) | 0;


    //table.op[opts.table_index] = 64;
    //table.bits[opts.table_index] = 1;
    //table.val[opts.table_index++] = 0;
    table[table_index++] = (1 << 24) | (64 << 16) | 0;

    opts.bits = 1;
    return 0;     /* no symbols, but wait for decoding to report error */
  }
  for (min = 1; min < max; min++) {
    if (count[min] !== 0) { break; }
  }
  if (root < min) {
    root = min;
  }

  /* check for an over-subscribed or incomplete set of lengths */
  left = 1;
  for (len = 1; len <= MAXBITS; len++) {
    left <<= 1;
    left -= count[len];
    if (left < 0) {
      return -1;
    }        /* over-subscribed */
  }
  if (left > 0 && (type === CODES || max !== 1)) {
    return -1;                      /* incomplete set */
  }

  /* generate offsets into symbol table for each length for sorting */
  offs[1] = 0;
  for (len = 1; len < MAXBITS; len++) {
    offs[len + 1] = offs[len] + count[len];
  }

  /* sort symbols by length, by symbol order within each length */
  for (sym = 0; sym < codes; sym++) {
    if (lens[lens_index + sym] !== 0) {
      work[offs[lens[lens_index + sym]]++] = sym;
    }
  }

  /*
   Create and fill in decoding tables.  In this loop, the table being
   filled is at next and has curr index bits.  The code being used is huff
   with length len.  That code is converted to an index by dropping drop
   bits off of the bottom.  For codes where len is less than drop + curr,
   those top drop + curr - len bits are incremented through all values to
   fill the table with replicated entries.

   root is the number of index bits for the root table.  When len exceeds
   root, sub-tables are created pointed to by the root entry with an index
   of the low root bits of huff.  This is saved in low to check for when a
   new sub-table should be started.  drop is zero when the root table is
   being filled, and drop is root when sub-tables are being filled.

   When a new sub-table is needed, it is necessary to look ahead in the
   code lengths to determine what size sub-table is needed.  The length
   counts are used for this, and so count[] is decremented as codes are
   entered in the tables.

   used keeps track of how many table entries have been allocated from the
   provided *table space.  It is checked for LENS and DIST tables against
   the constants ENOUGH_LENS and ENOUGH_DISTS to guard against changes in
   the initial root table size constants.  See the comments in inftrees.h
   for more information.

   sym increments through all symbols, and the loop terminates when
   all codes of length max, i.e. all codes, have been processed.  This
   routine permits incomplete codes, so another loop after this one fills
   in the rest of the decoding tables with invalid code markers.
   */

  /* set up for code type */
  // poor man optimization - use if-else instead of switch,
  // to avoid deopts in old v8
  if (type === CODES) {
    base = extra = work;    /* dummy value--not used */
    end = 19;

  } else if (type === LENS) {
    base = lbase;
    base_index -= 257;
    extra = lext;
    extra_index -= 257;
    end = 256;

  } else {                    /* DISTS */
    base = dbase;
    extra = dext;
    end = -1;
  }

  /* initialize opts for loop */
  huff = 0;                   /* starting code */
  sym = 0;                    /* starting code symbol */
  len = min;                  /* starting code length */
  next = table_index;              /* current table to fill in */
  curr = root;                /* current table index bits */
  drop = 0;                   /* current bits to drop from code for index */
  low = -1;                   /* trigger new sub-table when len > root */
  used = 1 << root;          /* use root table entries */
  mask = used - 1;            /* mask for comparing low */

  /* check available table space */
  if ((type === LENS && used > ENOUGH_LENS) ||
    (type === DISTS && used > ENOUGH_DISTS)) {
    return 1;
  }

  var i=0;
  /* process all codes and make table entries */
  for (;;) {
    i++;
    /* create table entry */
    here_bits = len - drop;
    if (work[sym] < end) {
      here_op = 0;
      here_val = work[sym];
    }
    else if (work[sym] > end) {
      here_op = extra[extra_index + work[sym]];
      here_val = base[base_index + work[sym]];
    }
    else {
      here_op = 32 + 64;         /* end of block */
      here_val = 0;
    }

    /* replicate for those indices with low len bits equal to huff */
    incr = 1 << (len - drop);
    fill = 1 << curr;
    min = fill;                 /* save offset to next table */
    do {
      fill -= incr;
      table[next + (huff >> drop) + fill] = (here_bits << 24) | (here_op << 16) | here_val |0;
    } while (fill !== 0);

    /* backwards increment the len-bit code huff */
    incr = 1 << (len - 1);
    while (huff & incr) {
      incr >>= 1;
    }
    if (incr !== 0) {
      huff &= incr - 1;
      huff += incr;
    } else {
      huff = 0;
    }

    /* go to next symbol, update count, len */
    sym++;
    if (--count[len] === 0) {
      if (len === max) { break; }
      len = lens[lens_index + work[sym]];
    }

    /* create new sub-table if needed */
    if (len > root && (huff & mask) !== low) {
      /* if first time, transition to sub-tables */
      if (drop === 0) {
        drop = root;
      }

      /* increment past last table */
      next += min;            /* here min is 1 << curr */

      /* determine length of next table */
      curr = len - drop;
      left = 1 << curr;
      while (curr + drop < max) {
        left -= count[curr + drop];
        if (left <= 0) { break; }
        curr++;
        left <<= 1;
      }

      /* check for enough space */
      used += 1 << curr;
      if ((type === LENS && used > ENOUGH_LENS) ||
        (type === DISTS && used > ENOUGH_DISTS)) {
        return 1;
      }

      /* point entry in root table to sub-table */
      low = huff & mask;
      /*table.op[low] = curr;
      table.bits[low] = root;
      table.val[low] = next - opts.table_index;*/
      table[low] = (root << 24) | (curr << 16) | (next - table_index) |0;
    }
  }

  /* fill in remaining table entry if code is incomplete (guaranteed to have
   at most one remaining entry, since if the code is incomplete, the
   maximum code length that was allowed to get this far is one bit) */
  if (huff !== 0) {
    //table.op[next + huff] = 64;            /* invalid code marker */
    //table.bits[next + huff] = len - drop;
    //table.val[next + huff] = 0;
    table[next + huff] = ((len - drop) << 24) | (64 << 16) |0;
  }

  /* set return parameters */
  //opts.table_index += used;
  opts.bits = root;
  return 0;
};

},{"../utils/common":31}],41:[function(require,module,exports){
'use strict';

module.exports = {
  '2':    'need dictionary',     /* Z_NEED_DICT       2  */
  '1':    'stream end',          /* Z_STREAM_END      1  */
  '0':    '',                    /* Z_OK              0  */
  '-1':   'file error',          /* Z_ERRNO         (-1) */
  '-2':   'stream error',        /* Z_STREAM_ERROR  (-2) */
  '-3':   'data error',          /* Z_DATA_ERROR    (-3) */
  '-4':   'insufficient memory', /* Z_MEM_ERROR     (-4) */
  '-5':   'buffer error',        /* Z_BUF_ERROR     (-5) */
  '-6':   'incompatible version' /* Z_VERSION_ERROR (-6) */
};

},{}],42:[function(require,module,exports){
'use strict';


var utils = require('../utils/common');

/* Public constants ==========================================================*/
/* ===========================================================================*/


//var Z_FILTERED          = 1;
//var Z_HUFFMAN_ONLY      = 2;
//var Z_RLE               = 3;
var Z_FIXED               = 4;
//var Z_DEFAULT_STRATEGY  = 0;

/* Possible values of the data_type field (though see inflate()) */
var Z_BINARY              = 0;
var Z_TEXT                = 1;
//var Z_ASCII             = 1; // = Z_TEXT
var Z_UNKNOWN             = 2;

/*============================================================================*/


function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }

// From zutil.h

var STORED_BLOCK = 0;
var STATIC_TREES = 1;
var DYN_TREES    = 2;
/* The three kinds of block type */

var MIN_MATCH    = 3;
var MAX_MATCH    = 258;
/* The minimum and maximum match lengths */

// From deflate.h
/* ===========================================================================
 * Internal compression state.
 */

var LENGTH_CODES  = 29;
/* number of length codes, not counting the special END_BLOCK code */

var LITERALS      = 256;
/* number of literal bytes 0..255 */

var L_CODES       = LITERALS + 1 + LENGTH_CODES;
/* number of Literal or Length codes, including the END_BLOCK code */

var D_CODES       = 30;
/* number of distance codes */

var BL_CODES      = 19;
/* number of codes used to transfer the bit lengths */

var HEAP_SIZE     = 2*L_CODES + 1;
/* maximum heap size */

var MAX_BITS      = 15;
/* All codes must not exceed MAX_BITS bits */

var Buf_size      = 16;
/* size of bit buffer in bi_buf */


/* ===========================================================================
 * Constants
 */

var MAX_BL_BITS = 7;
/* Bit length codes must not exceed MAX_BL_BITS bits */

var END_BLOCK   = 256;
/* end of block literal code */

var REP_3_6     = 16;
/* repeat previous bit length 3-6 times (2 bits of repeat count) */

var REPZ_3_10   = 17;
/* repeat a zero length 3-10 times  (3 bits of repeat count) */

var REPZ_11_138 = 18;
/* repeat a zero length 11-138 times  (7 bits of repeat count) */

var extra_lbits =   /* extra bits for each length code */
  [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];

var extra_dbits =   /* extra bits for each distance code */
  [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];

var extra_blbits =  /* extra bits for each bit length code */
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7];

var bl_order =
  [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
/* The lengths of the bit length codes are sent in order of decreasing
 * probability, to avoid transmitting the lengths for unused bit length codes.
 */

/* ===========================================================================
 * Local data. These are initialized only once.
 */

// We pre-fill arrays with 0 to avoid uninitialized gaps

var DIST_CODE_LEN = 512; /* see definition of array dist_code below */

// !!!! Use flat array insdead of structure, Freq = i*2, Len = i*2+1
var static_ltree  = new Array((L_CODES+2) * 2);
zero(static_ltree);
/* The static literal tree. Since the bit lengths are imposed, there is no
 * need for the L_CODES extra codes used during heap construction. However
 * The codes 286 and 287 are needed to build a canonical tree (see _tr_init
 * below).
 */

var static_dtree  = new Array(D_CODES * 2);
zero(static_dtree);
/* The static distance tree. (Actually a trivial tree since all codes use
 * 5 bits.)
 */

var _dist_code    = new Array(DIST_CODE_LEN);
zero(_dist_code);
/* Distance codes. The first 256 values correspond to the distances
 * 3 .. 258, the last 256 values correspond to the top 8 bits of
 * the 15 bit distances.
 */

var _length_code  = new Array(MAX_MATCH-MIN_MATCH+1);
zero(_length_code);
/* length code for each normalized match length (0 == MIN_MATCH) */

var base_length   = new Array(LENGTH_CODES);
zero(base_length);
/* First normalized length for each code (0 = MIN_MATCH) */

var base_dist     = new Array(D_CODES);
zero(base_dist);
/* First normalized distance for each code (0 = distance of 1) */


var StaticTreeDesc = function (static_tree, extra_bits, extra_base, elems, max_length) {

  this.static_tree  = static_tree;  /* static tree or NULL */
  this.extra_bits   = extra_bits;   /* extra bits for each code or NULL */
  this.extra_base   = extra_base;   /* base index for extra_bits */
  this.elems        = elems;        /* max number of elements in the tree */
  this.max_length   = max_length;   /* max bit length for the codes */

  // show if `static_tree` has data or dummy - needed for monomorphic objects
  this.has_stree    = static_tree && static_tree.length;
};


var static_l_desc;
var static_d_desc;
var static_bl_desc;


var TreeDesc = function(dyn_tree, stat_desc) {
  this.dyn_tree = dyn_tree;     /* the dynamic tree */
  this.max_code = 0;            /* largest code with non zero frequency */
  this.stat_desc = stat_desc;   /* the corresponding static tree */
};



function d_code(dist) {
  return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
}


/* ===========================================================================
 * Output a short LSB first on the stream.
 * IN assertion: there is enough room in pendingBuf.
 */
function put_short (s, w) {
//    put_byte(s, (uch)((w) & 0xff));
//    put_byte(s, (uch)((ush)(w) >> 8));
  s.pending_buf[s.pending++] = (w) & 0xff;
  s.pending_buf[s.pending++] = (w >>> 8) & 0xff;
}


/* ===========================================================================
 * Send a value on a given number of bits.
 * IN assertion: length <= 16 and value fits in length bits.
 */
function send_bits(s, value, length) {
  if (s.bi_valid > (Buf_size - length)) {
    s.bi_buf |= (value << s.bi_valid) & 0xffff;
    put_short(s, s.bi_buf);
    s.bi_buf = value >> (Buf_size - s.bi_valid);
    s.bi_valid += length - Buf_size;
  } else {
    s.bi_buf |= (value << s.bi_valid) & 0xffff;
    s.bi_valid += length;
  }
}


function send_code(s, c, tree) {
  send_bits(s, tree[c*2]/*.Code*/, tree[c*2 + 1]/*.Len*/);
}


/* ===========================================================================
 * Reverse the first len bits of a code, using straightforward code (a faster
 * method would use a table)
 * IN assertion: 1 <= len <= 15
 */
function bi_reverse(code, len) {
  var res = 0;
  do {
    res |= code & 1;
    code >>>= 1;
    res <<= 1;
  } while (--len > 0);
  return res >>> 1;
}


/* ===========================================================================
 * Flush the bit buffer, keeping at most 7 bits in it.
 */
function bi_flush(s) {
  if (s.bi_valid === 16) {
    put_short(s, s.bi_buf);
    s.bi_buf = 0;
    s.bi_valid = 0;

  } else if (s.bi_valid >= 8) {
    s.pending_buf[s.pending++] = s.bi_buf & 0xff;
    s.bi_buf >>= 8;
    s.bi_valid -= 8;
  }
}


/* ===========================================================================
 * Compute the optimal bit lengths for a tree and update the total bit length
 * for the current block.
 * IN assertion: the fields freq and dad are set, heap[heap_max] and
 *    above are the tree nodes sorted by increasing frequency.
 * OUT assertions: the field len is set to the optimal bit length, the
 *     array bl_count contains the frequencies for each bit length.
 *     The length opt_len is updated; static_len is also updated if stree is
 *     not null.
 */
function gen_bitlen(s, desc)
//    deflate_state *s;
//    tree_desc *desc;    /* the tree descriptor */
{
  var tree            = desc.dyn_tree;
  var max_code        = desc.max_code;
  var stree           = desc.stat_desc.static_tree;
  var has_stree       = desc.stat_desc.has_stree;
  var extra           = desc.stat_desc.extra_bits;
  var base            = desc.stat_desc.extra_base;
  var max_length      = desc.stat_desc.max_length;
  var h;              /* heap index */
  var n, m;           /* iterate over the tree elements */
  var bits;           /* bit length */
  var xbits;          /* extra bits */
  var f;              /* frequency */
  var overflow = 0;   /* number of elements with bit length too large */

  for (bits = 0; bits <= MAX_BITS; bits++) {
    s.bl_count[bits] = 0;
  }

  /* In a first pass, compute the optimal bit lengths (which may
   * overflow in the case of the bit length tree).
   */
  tree[s.heap[s.heap_max]*2 + 1]/*.Len*/ = 0; /* root of the heap */

  for (h = s.heap_max+1; h < HEAP_SIZE; h++) {
    n = s.heap[h];
    bits = tree[tree[n*2 +1]/*.Dad*/ * 2 + 1]/*.Len*/ + 1;
    if (bits > max_length) {
      bits = max_length;
      overflow++;
    }
    tree[n*2 + 1]/*.Len*/ = bits;
    /* We overwrite tree[n].Dad which is no longer needed */

    if (n > max_code) { continue; } /* not a leaf node */

    s.bl_count[bits]++;
    xbits = 0;
    if (n >= base) {
      xbits = extra[n-base];
    }
    f = tree[n * 2]/*.Freq*/;
    s.opt_len += f * (bits + xbits);
    if (has_stree) {
      s.static_len += f * (stree[n*2 + 1]/*.Len*/ + xbits);
    }
  }
  if (overflow === 0) { return; }

  // Trace((stderr,"\nbit length overflow\n"));
  /* This happens for example on obj2 and pic of the Calgary corpus */

  /* Find the first bit length which could increase: */
  do {
    bits = max_length-1;
    while (s.bl_count[bits] === 0) { bits--; }
    s.bl_count[bits]--;      /* move one leaf down the tree */
    s.bl_count[bits+1] += 2; /* move one overflow item as its brother */
    s.bl_count[max_length]--;
    /* The brother of the overflow item also moves one step up,
     * but this does not affect bl_count[max_length]
     */
    overflow -= 2;
  } while (overflow > 0);

  /* Now recompute all bit lengths, scanning in increasing frequency.
   * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
   * lengths instead of fixing only the wrong ones. This idea is taken
   * from 'ar' written by Haruhiko Okumura.)
   */
  for (bits = max_length; bits !== 0; bits--) {
    n = s.bl_count[bits];
    while (n !== 0) {
      m = s.heap[--h];
      if (m > max_code) { continue; }
      if (tree[m*2 + 1]/*.Len*/ !== bits) {
        // Trace((stderr,"code %d bits %d->%d\n", m, tree[m].Len, bits));
        s.opt_len += (bits - tree[m*2 + 1]/*.Len*/)*tree[m*2]/*.Freq*/;
        tree[m*2 + 1]/*.Len*/ = bits;
      }
      n--;
    }
  }
}


/* ===========================================================================
 * Generate the codes for a given tree and bit counts (which need not be
 * optimal).
 * IN assertion: the array bl_count contains the bit length statistics for
 * the given tree and the field len is set for all tree elements.
 * OUT assertion: the field code is set for all tree elements of non
 *     zero code length.
 */
function gen_codes(tree, max_code, bl_count)
//    ct_data *tree;             /* the tree to decorate */
//    int max_code;              /* largest code with non zero frequency */
//    ushf *bl_count;            /* number of codes at each bit length */
{
  var next_code = new Array(MAX_BITS+1); /* next code value for each bit length */
  var code = 0;              /* running code value */
  var bits;                  /* bit index */
  var n;                     /* code index */

  /* The distribution counts are first used to generate the code values
   * without bit reversal.
   */
  for (bits = 1; bits <= MAX_BITS; bits++) {
    next_code[bits] = code = (code + bl_count[bits-1]) << 1;
  }
  /* Check that the bit counts in bl_count are consistent. The last code
   * must be all ones.
   */
  //Assert (code + bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,
  //        "inconsistent bit counts");
  //Tracev((stderr,"\ngen_codes: max_code %d ", max_code));

  for (n = 0;  n <= max_code; n++) {
    var len = tree[n*2 + 1]/*.Len*/;
    if (len === 0) { continue; }
    /* Now reverse the bits */
    tree[n*2]/*.Code*/ = bi_reverse(next_code[len]++, len);

    //Tracecv(tree != static_ltree, (stderr,"\nn %3d %c l %2d c %4x (%x) ",
    //     n, (isgraph(n) ? n : ' '), len, tree[n].Code, next_code[len]-1));
  }
}


/* ===========================================================================
 * Initialize the various 'constant' tables.
 */
function tr_static_init() {
  var n;        /* iterates over tree elements */
  var bits;     /* bit counter */
  var length;   /* length value */
  var code;     /* code value */
  var dist;     /* distance index */
  var bl_count = new Array(MAX_BITS+1);
  /* number of codes at each bit length for an optimal tree */

  // do check in _tr_init()
  //if (static_init_done) return;

  /* For some embedded targets, global variables are not initialized: */
/*#ifdef NO_INIT_GLOBAL_POINTERS
  static_l_desc.static_tree = static_ltree;
  static_l_desc.extra_bits = extra_lbits;
  static_d_desc.static_tree = static_dtree;
  static_d_desc.extra_bits = extra_dbits;
  static_bl_desc.extra_bits = extra_blbits;
#endif*/

  /* Initialize the mapping length (0..255) -> length code (0..28) */
  length = 0;
  for (code = 0; code < LENGTH_CODES-1; code++) {
    base_length[code] = length;
    for (n = 0; n < (1<<extra_lbits[code]); n++) {
      _length_code[length++] = code;
    }
  }
  //Assert (length == 256, "tr_static_init: length != 256");
  /* Note that the length 255 (match length 258) can be represented
   * in two different ways: code 284 + 5 bits or code 285, so we
   * overwrite length_code[255] to use the best encoding:
   */
  _length_code[length-1] = code;

  /* Initialize the mapping dist (0..32K) -> dist code (0..29) */
  dist = 0;
  for (code = 0 ; code < 16; code++) {
    base_dist[code] = dist;
    for (n = 0; n < (1<<extra_dbits[code]); n++) {
      _dist_code[dist++] = code;
    }
  }
  //Assert (dist == 256, "tr_static_init: dist != 256");
  dist >>= 7; /* from now on, all distances are divided by 128 */
  for (; code < D_CODES; code++) {
    base_dist[code] = dist << 7;
    for (n = 0; n < (1<<(extra_dbits[code]-7)); n++) {
      _dist_code[256 + dist++] = code;
    }
  }
  //Assert (dist == 256, "tr_static_init: 256+dist != 512");

  /* Construct the codes of the static literal tree */
  for (bits = 0; bits <= MAX_BITS; bits++) {
    bl_count[bits] = 0;
  }

  n = 0;
  while (n <= 143) {
    static_ltree[n*2 + 1]/*.Len*/ = 8;
    n++;
    bl_count[8]++;
  }
  while (n <= 255) {
    static_ltree[n*2 + 1]/*.Len*/ = 9;
    n++;
    bl_count[9]++;
  }
  while (n <= 279) {
    static_ltree[n*2 + 1]/*.Len*/ = 7;
    n++;
    bl_count[7]++;
  }
  while (n <= 287) {
    static_ltree[n*2 + 1]/*.Len*/ = 8;
    n++;
    bl_count[8]++;
  }
  /* Codes 286 and 287 do not exist, but we must include them in the
   * tree construction to get a canonical Huffman tree (longest code
   * all ones)
   */
  gen_codes(static_ltree, L_CODES+1, bl_count);

  /* The static distance tree is trivial: */
  for (n = 0; n < D_CODES; n++) {
    static_dtree[n*2 + 1]/*.Len*/ = 5;
    static_dtree[n*2]/*.Code*/ = bi_reverse(n, 5);
  }

  // Now data ready and we can init static trees
  static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS+1, L_CODES, MAX_BITS);
  static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0,          D_CODES, MAX_BITS);
  static_bl_desc =new StaticTreeDesc(new Array(0), extra_blbits, 0,         BL_CODES, MAX_BL_BITS);

  //static_init_done = true;
}


/* ===========================================================================
 * Initialize a new block.
 */
function init_block(s) {
  var n; /* iterates over tree elements */

  /* Initialize the trees. */
  for (n = 0; n < L_CODES;  n++) { s.dyn_ltree[n*2]/*.Freq*/ = 0; }
  for (n = 0; n < D_CODES;  n++) { s.dyn_dtree[n*2]/*.Freq*/ = 0; }
  for (n = 0; n < BL_CODES; n++) { s.bl_tree[n*2]/*.Freq*/ = 0; }

  s.dyn_ltree[END_BLOCK*2]/*.Freq*/ = 1;
  s.opt_len = s.static_len = 0;
  s.last_lit = s.matches = 0;
}


/* ===========================================================================
 * Flush the bit buffer and align the output on a byte boundary
 */
function bi_windup(s)
{
  if (s.bi_valid > 8) {
    put_short(s, s.bi_buf);
  } else if (s.bi_valid > 0) {
    //put_byte(s, (Byte)s->bi_buf);
    s.pending_buf[s.pending++] = s.bi_buf;
  }
  s.bi_buf = 0;
  s.bi_valid = 0;
}

/* ===========================================================================
 * Copy a stored block, storing first the length and its
 * one's complement if requested.
 */
function copy_block(s, buf, len, header)
//DeflateState *s;
//charf    *buf;    /* the input data */
//unsigned len;     /* its length */
//int      header;  /* true if block header must be written */
{
  bi_windup(s);        /* align on byte boundary */

  if (header) {
    put_short(s, len);
    put_short(s, ~len);
  }
//  while (len--) {
//    put_byte(s, *buf++);
//  }
  utils.arraySet(s.pending_buf, s.window, buf, len, s.pending);
  s.pending += len;
}

/* ===========================================================================
 * Compares to subtrees, using the tree depth as tie breaker when
 * the subtrees have equal frequency. This minimizes the worst case length.
 */
function smaller(tree, n, m, depth) {
  var _n2 = n*2;
  var _m2 = m*2;
  return (tree[_n2]/*.Freq*/ < tree[_m2]/*.Freq*/ ||
         (tree[_n2]/*.Freq*/ === tree[_m2]/*.Freq*/ && depth[n] <= depth[m]));
}

/* ===========================================================================
 * Restore the heap property by moving down the tree starting at node k,
 * exchanging a node with the smallest of its two sons if necessary, stopping
 * when the heap property is re-established (each father smaller than its
 * two sons).
 */
function pqdownheap(s, tree, k)
//    deflate_state *s;
//    ct_data *tree;  /* the tree to restore */
//    int k;               /* node to move down */
{
  var v = s.heap[k];
  var j = k << 1;  /* left son of k */
  while (j <= s.heap_len) {
    /* Set j to the smallest of the two sons: */
    if (j < s.heap_len &&
      smaller(tree, s.heap[j+1], s.heap[j], s.depth)) {
      j++;
    }
    /* Exit if v is smaller than both sons */
    if (smaller(tree, v, s.heap[j], s.depth)) { break; }

    /* Exchange v with the smallest son */
    s.heap[k] = s.heap[j];
    k = j;

    /* And continue down the tree, setting j to the left son of k */
    j <<= 1;
  }
  s.heap[k] = v;
}


// inlined manually
// var SMALLEST = 1;

/* ===========================================================================
 * Send the block data compressed using the given Huffman trees
 */
function compress_block(s, ltree, dtree)
//    deflate_state *s;
//    const ct_data *ltree; /* literal tree */
//    const ct_data *dtree; /* distance tree */
{
  var dist;           /* distance of matched string */
  var lc;             /* match length or unmatched char (if dist == 0) */
  var lx = 0;         /* running index in l_buf */
  var code;           /* the code to send */
  var extra;          /* number of extra bits to send */

  if (s.last_lit !== 0) {
    do {
      dist = (s.pending_buf[s.d_buf + lx*2] << 8) | (s.pending_buf[s.d_buf + lx*2 + 1]);
      lc = s.pending_buf[s.l_buf + lx];
      lx++;

      if (dist === 0) {
        send_code(s, lc, ltree); /* send a literal byte */
        //Tracecv(isgraph(lc), (stderr," '%c' ", lc));
      } else {
        /* Here, lc is the match length - MIN_MATCH */
        code = _length_code[lc];
        send_code(s, code+LITERALS+1, ltree); /* send the length code */
        extra = extra_lbits[code];
        if (extra !== 0) {
          lc -= base_length[code];
          send_bits(s, lc, extra);       /* send the extra length bits */
        }
        dist--; /* dist is now the match distance - 1 */
        code = d_code(dist);
        //Assert (code < D_CODES, "bad d_code");

        send_code(s, code, dtree);       /* send the distance code */
        extra = extra_dbits[code];
        if (extra !== 0) {
          dist -= base_dist[code];
          send_bits(s, dist, extra);   /* send the extra distance bits */
        }
      } /* literal or match pair ? */

      /* Check that the overlay between pending_buf and d_buf+l_buf is ok: */
      //Assert((uInt)(s->pending) < s->lit_bufsize + 2*lx,
      //       "pendingBuf overflow");

    } while (lx < s.last_lit);
  }

  send_code(s, END_BLOCK, ltree);
}


/* ===========================================================================
 * Construct one Huffman tree and assigns the code bit strings and lengths.
 * Update the total bit length for the current block.
 * IN assertion: the field freq is set for all tree elements.
 * OUT assertions: the fields len and code are set to the optimal bit length
 *     and corresponding code. The length opt_len is updated; static_len is
 *     also updated if stree is not null. The field max_code is set.
 */
function build_tree(s, desc)
//    deflate_state *s;
//    tree_desc *desc; /* the tree descriptor */
{
  var tree     = desc.dyn_tree;
  var stree    = desc.stat_desc.static_tree;
  var has_stree = desc.stat_desc.has_stree;
  var elems    = desc.stat_desc.elems;
  var n, m;          /* iterate over heap elements */
  var max_code = -1; /* largest code with non zero frequency */
  var node;          /* new node being created */

  /* Construct the initial heap, with least frequent element in
   * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
   * heap[0] is not used.
   */
  s.heap_len = 0;
  s.heap_max = HEAP_SIZE;

  for (n = 0; n < elems; n++) {
    if (tree[n * 2]/*.Freq*/ !== 0) {
      s.heap[++s.heap_len] = max_code = n;
      s.depth[n] = 0;

    } else {
      tree[n*2 + 1]/*.Len*/ = 0;
    }
  }

  /* The pkzip format requires that at least one distance code exists,
   * and that at least one bit should be sent even if there is only one
   * possible code. So to avoid special checks later on we force at least
   * two codes of non zero frequency.
   */
  while (s.heap_len < 2) {
    node = s.heap[++s.heap_len] = (max_code < 2 ? ++max_code : 0);
    tree[node * 2]/*.Freq*/ = 1;
    s.depth[node] = 0;
    s.opt_len--;

    if (has_stree) {
      s.static_len -= stree[node*2 + 1]/*.Len*/;
    }
    /* node is 0 or 1 so it does not have extra bits */
  }
  desc.max_code = max_code;

  /* The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
   * establish sub-heaps of increasing lengths:
   */
  for (n = (s.heap_len >> 1/*int /2*/); n >= 1; n--) { pqdownheap(s, tree, n); }

  /* Construct the Huffman tree by repeatedly combining the least two
   * frequent nodes.
   */
  node = elems;              /* next internal node of the tree */
  do {
    //pqremove(s, tree, n);  /* n = node of least frequency */
    /*** pqremove ***/
    n = s.heap[1/*SMALLEST*/];
    s.heap[1/*SMALLEST*/] = s.heap[s.heap_len--];
    pqdownheap(s, tree, 1/*SMALLEST*/);
    /***/

    m = s.heap[1/*SMALLEST*/]; /* m = node of next least frequency */

    s.heap[--s.heap_max] = n; /* keep the nodes sorted by frequency */
    s.heap[--s.heap_max] = m;

    /* Create a new node father of n and m */
    tree[node * 2]/*.Freq*/ = tree[n * 2]/*.Freq*/ + tree[m * 2]/*.Freq*/;
    s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
    tree[n*2 + 1]/*.Dad*/ = tree[m*2 + 1]/*.Dad*/ = node;

    /* and insert the new node in the heap */
    s.heap[1/*SMALLEST*/] = node++;
    pqdownheap(s, tree, 1/*SMALLEST*/);

  } while (s.heap_len >= 2);

  s.heap[--s.heap_max] = s.heap[1/*SMALLEST*/];

  /* At this point, the fields freq and dad are set. We can now
   * generate the bit lengths.
   */
  gen_bitlen(s, desc);

  /* The field len is now set, we can generate the bit codes */
  gen_codes(tree, max_code, s.bl_count);
}


/* ===========================================================================
 * Scan a literal or distance tree to determine the frequencies of the codes
 * in the bit length tree.
 */
function scan_tree(s, tree, max_code)
//    deflate_state *s;
//    ct_data *tree;   /* the tree to be scanned */
//    int max_code;    /* and its largest code of non zero frequency */
{
  var n;                     /* iterates over all tree elements */
  var prevlen = -1;          /* last emitted length */
  var curlen;                /* length of current code */

  var nextlen = tree[0*2 + 1]/*.Len*/; /* length of next code */

  var count = 0;             /* repeat count of the current code */
  var max_count = 7;         /* max repeat count */
  var min_count = 4;         /* min repeat count */

  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  tree[(max_code+1)*2 + 1]/*.Len*/ = 0xffff; /* guard */

  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n+1)*2 + 1]/*.Len*/;

    if (++count < max_count && curlen === nextlen) {
      continue;

    } else if (count < min_count) {
      s.bl_tree[curlen * 2]/*.Freq*/ += count;

    } else if (curlen !== 0) {

      if (curlen !== prevlen) { s.bl_tree[curlen * 2]/*.Freq*/++; }
      s.bl_tree[REP_3_6*2]/*.Freq*/++;

    } else if (count <= 10) {
      s.bl_tree[REPZ_3_10*2]/*.Freq*/++;

    } else {
      s.bl_tree[REPZ_11_138*2]/*.Freq*/++;
    }

    count = 0;
    prevlen = curlen;

    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;

    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;

    } else {
      max_count = 7;
      min_count = 4;
    }
  }
}


/* ===========================================================================
 * Send a literal or distance tree in compressed form, using the codes in
 * bl_tree.
 */
function send_tree(s, tree, max_code)
//    deflate_state *s;
//    ct_data *tree; /* the tree to be scanned */
//    int max_code;       /* and its largest code of non zero frequency */
{
  var n;                     /* iterates over all tree elements */
  var prevlen = -1;          /* last emitted length */
  var curlen;                /* length of current code */

  var nextlen = tree[0*2 + 1]/*.Len*/; /* length of next code */

  var count = 0;             /* repeat count of the current code */
  var max_count = 7;         /* max repeat count */
  var min_count = 4;         /* min repeat count */

  /* tree[max_code+1].Len = -1; */  /* guard already set */
  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }

  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n+1)*2 + 1]/*.Len*/;

    if (++count < max_count && curlen === nextlen) {
      continue;

    } else if (count < min_count) {
      do { send_code(s, curlen, s.bl_tree); } while (--count !== 0);

    } else if (curlen !== 0) {
      if (curlen !== prevlen) {
        send_code(s, curlen, s.bl_tree);
        count--;
      }
      //Assert(count >= 3 && count <= 6, " 3_6?");
      send_code(s, REP_3_6, s.bl_tree);
      send_bits(s, count-3, 2);

    } else if (count <= 10) {
      send_code(s, REPZ_3_10, s.bl_tree);
      send_bits(s, count-3, 3);

    } else {
      send_code(s, REPZ_11_138, s.bl_tree);
      send_bits(s, count-11, 7);
    }

    count = 0;
    prevlen = curlen;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;

    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;

    } else {
      max_count = 7;
      min_count = 4;
    }
  }
}


/* ===========================================================================
 * Construct the Huffman tree for the bit lengths and return the index in
 * bl_order of the last bit length code to send.
 */
function build_bl_tree(s) {
  var max_blindex;  /* index of last bit length code of non zero freq */

  /* Determine the bit length frequencies for literal and distance trees */
  scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
  scan_tree(s, s.dyn_dtree, s.d_desc.max_code);

  /* Build the bit length tree: */
  build_tree(s, s.bl_desc);
  /* opt_len now includes the length of the tree representations, except
   * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
   */

  /* Determine the number of bit length codes to send. The pkzip format
   * requires that at least 4 bit length codes be sent. (appnote.txt says
   * 3 but the actual value used is 4.)
   */
  for (max_blindex = BL_CODES-1; max_blindex >= 3; max_blindex--) {
    if (s.bl_tree[bl_order[max_blindex]*2 + 1]/*.Len*/ !== 0) {
      break;
    }
  }
  /* Update opt_len to include the bit length tree and counts */
  s.opt_len += 3*(max_blindex+1) + 5+5+4;
  //Tracev((stderr, "\ndyn trees: dyn %ld, stat %ld",
  //        s->opt_len, s->static_len));

  return max_blindex;
}


/* ===========================================================================
 * Send the header for a block using dynamic Huffman trees: the counts, the
 * lengths of the bit length codes, the literal tree and the distance tree.
 * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
 */
function send_all_trees(s, lcodes, dcodes, blcodes)
//    deflate_state *s;
//    int lcodes, dcodes, blcodes; /* number of codes for each tree */
{
  var rank;                    /* index in bl_order */

  //Assert (lcodes >= 257 && dcodes >= 1 && blcodes >= 4, "not enough codes");
  //Assert (lcodes <= L_CODES && dcodes <= D_CODES && blcodes <= BL_CODES,
  //        "too many codes");
  //Tracev((stderr, "\nbl counts: "));
  send_bits(s, lcodes-257, 5); /* not +255 as stated in appnote.txt */
  send_bits(s, dcodes-1,   5);
  send_bits(s, blcodes-4,  4); /* not -3 as stated in appnote.txt */
  for (rank = 0; rank < blcodes; rank++) {
    //Tracev((stderr, "\nbl code %2d ", bl_order[rank]));
    send_bits(s, s.bl_tree[bl_order[rank]*2 + 1]/*.Len*/, 3);
  }
  //Tracev((stderr, "\nbl tree: sent %ld", s->bits_sent));

  send_tree(s, s.dyn_ltree, lcodes-1); /* literal tree */
  //Tracev((stderr, "\nlit tree: sent %ld", s->bits_sent));

  send_tree(s, s.dyn_dtree, dcodes-1); /* distance tree */
  //Tracev((stderr, "\ndist tree: sent %ld", s->bits_sent));
}


/* ===========================================================================
 * Check if the data type is TEXT or BINARY, using the following algorithm:
 * - TEXT if the two conditions below are satisfied:
 *    a) There are no non-portable control characters belonging to the
 *       "black list" (0..6, 14..25, 28..31).
 *    b) There is at least one printable character belonging to the
 *       "white list" (9 {TAB}, 10 {LF}, 13 {CR}, 32..255).
 * - BINARY otherwise.
 * - The following partially-portable control characters form a
 *   "gray list" that is ignored in this detection algorithm:
 *   (7 {BEL}, 8 {BS}, 11 {VT}, 12 {FF}, 26 {SUB}, 27 {ESC}).
 * IN assertion: the fields Freq of dyn_ltree are set.
 */
function detect_data_type(s) {
  /* black_mask is the bit mask of black-listed bytes
   * set bits 0..6, 14..25, and 28..31
   * 0xf3ffc07f = binary 11110011111111111100000001111111
   */
  var black_mask = 0xf3ffc07f;
  var n;

  /* Check for non-textual ("black-listed") bytes. */
  for (n = 0; n <= 31; n++, black_mask >>>= 1) {
    if ((black_mask & 1) && (s.dyn_ltree[n*2]/*.Freq*/ !== 0)) {
      return Z_BINARY;
    }
  }

  /* Check for textual ("white-listed") bytes. */
  if (s.dyn_ltree[9 * 2]/*.Freq*/ !== 0 || s.dyn_ltree[10 * 2]/*.Freq*/ !== 0 ||
      s.dyn_ltree[13 * 2]/*.Freq*/ !== 0) {
    return Z_TEXT;
  }
  for (n = 32; n < LITERALS; n++) {
    if (s.dyn_ltree[n * 2]/*.Freq*/ !== 0) {
      return Z_TEXT;
    }
  }

  /* There are no "black-listed" or "white-listed" bytes:
   * this stream either is empty or has tolerated ("gray-listed") bytes only.
   */
  return Z_BINARY;
}


var static_init_done = false;

/* ===========================================================================
 * Initialize the tree data structures for a new zlib stream.
 */
function _tr_init(s)
{

  if (!static_init_done) {
    tr_static_init();
    static_init_done = true;
  }

  s.l_desc  = new TreeDesc(s.dyn_ltree, static_l_desc);
  s.d_desc  = new TreeDesc(s.dyn_dtree, static_d_desc);
  s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);

  s.bi_buf = 0;
  s.bi_valid = 0;

  /* Initialize the first block of the first file: */
  init_block(s);
}


/* ===========================================================================
 * Send a stored block
 */
function _tr_stored_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
{
  send_bits(s, (STORED_BLOCK<<1)+(last ? 1 : 0), 3);    /* send block type */
  copy_block(s, buf, stored_len, true); /* with header */
}


/* ===========================================================================
 * Send one empty static block to give enough lookahead for inflate.
 * This takes 10 bits, of which 7 may remain in the bit buffer.
 */
function _tr_align(s) {
  send_bits(s, STATIC_TREES<<1, 3);
  send_code(s, END_BLOCK, static_ltree);
  bi_flush(s);
}


/* ===========================================================================
 * Determine the best encoding for the current block: dynamic trees, static
 * trees or store, and output the encoded block to the zip file.
 */
function _tr_flush_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block, or NULL if too old */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
{
  var opt_lenb, static_lenb;  /* opt_len and static_len in bytes */
  var max_blindex = 0;        /* index of last bit length code of non zero freq */

  /* Build the Huffman trees unless a stored block is forced */
  if (s.level > 0) {

    /* Check if the file is binary or text */
    if (s.strm.data_type === Z_UNKNOWN) {
      s.strm.data_type = detect_data_type(s);
    }

    /* Construct the literal and distance trees */
    build_tree(s, s.l_desc);
    // Tracev((stderr, "\nlit data: dyn %ld, stat %ld", s->opt_len,
    //        s->static_len));

    build_tree(s, s.d_desc);
    // Tracev((stderr, "\ndist data: dyn %ld, stat %ld", s->opt_len,
    //        s->static_len));
    /* At this point, opt_len and static_len are the total bit lengths of
     * the compressed block data, excluding the tree representations.
     */

    /* Build the bit length tree for the above two trees, and get the index
     * in bl_order of the last bit length code to send.
     */
    max_blindex = build_bl_tree(s);

    /* Determine the best encoding. Compute the block lengths in bytes. */
    opt_lenb = (s.opt_len+3+7) >>> 3;
    static_lenb = (s.static_len+3+7) >>> 3;

    // Tracev((stderr, "\nopt %lu(%lu) stat %lu(%lu) stored %lu lit %u ",
    //        opt_lenb, s->opt_len, static_lenb, s->static_len, stored_len,
    //        s->last_lit));

    if (static_lenb <= opt_lenb) { opt_lenb = static_lenb; }

  } else {
    // Assert(buf != (char*)0, "lost buf");
    opt_lenb = static_lenb = stored_len + 5; /* force a stored block */
  }

  if ((stored_len+4 <= opt_lenb) && (buf !== -1)) {
    /* 4: two words for the lengths */

    /* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
     * Otherwise we can't have processed more than WSIZE input bytes since
     * the last block flush, because compression would have been
     * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
     * transform a block into a stored block.
     */
    _tr_stored_block(s, buf, stored_len, last);

  } else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {

    send_bits(s, (STATIC_TREES<<1) + (last ? 1 : 0), 3);
    compress_block(s, static_ltree, static_dtree);

  } else {
    send_bits(s, (DYN_TREES<<1) + (last ? 1 : 0), 3);
    send_all_trees(s, s.l_desc.max_code+1, s.d_desc.max_code+1, max_blindex+1);
    compress_block(s, s.dyn_ltree, s.dyn_dtree);
  }
  // Assert (s->compressed_len == s->bits_sent, "bad compressed size");
  /* The above check is made mod 2^32, for files larger than 512 MB
   * and uLong implemented on 32 bits.
   */
  init_block(s);

  if (last) {
    bi_windup(s);
  }
  // Tracev((stderr,"\ncomprlen %lu(%lu) ", s->compressed_len>>3,
  //       s->compressed_len-7*last));
}

/* ===========================================================================
 * Save the match info and tally the frequency counts. Return true if
 * the current block must be flushed.
 */
function _tr_tally(s, dist, lc)
//    deflate_state *s;
//    unsigned dist;  /* distance of matched string */
//    unsigned lc;    /* match length-MIN_MATCH or unmatched char (if dist==0) */
{
  //var out_length, in_length, dcode;

  s.pending_buf[s.d_buf + s.last_lit * 2]     = (dist >>> 8) & 0xff;
  s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 0xff;

  s.pending_buf[s.l_buf + s.last_lit] = lc & 0xff;
  s.last_lit++;

  if (dist === 0) {
    /* lc is the unmatched char */
    s.dyn_ltree[lc*2]/*.Freq*/++;
  } else {
    s.matches++;
    /* Here, lc is the match length - MIN_MATCH */
    dist--;             /* dist = match distance - 1 */
    //Assert((ush)dist < (ush)MAX_DIST(s) &&
    //       (ush)lc <= (ush)(MAX_MATCH-MIN_MATCH) &&
    //       (ush)d_code(dist) < (ush)D_CODES,  "_tr_tally: bad match");

    s.dyn_ltree[(_length_code[lc]+LITERALS+1) * 2]/*.Freq*/++;
    s.dyn_dtree[d_code(dist) * 2]/*.Freq*/++;
  }

// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility

//#ifdef TRUNCATE_BLOCK
//  /* Try to guess if it is profitable to stop the current block here */
//  if ((s.last_lit & 0x1fff) === 0 && s.level > 2) {
//    /* Compute an upper bound for the compressed length */
//    out_length = s.last_lit*8;
//    in_length = s.strstart - s.block_start;
//
//    for (dcode = 0; dcode < D_CODES; dcode++) {
//      out_length += s.dyn_dtree[dcode*2]/*.Freq*/ * (5 + extra_dbits[dcode]);
//    }
//    out_length >>>= 3;
//    //Tracev((stderr,"\nlast_lit %u, in %ld, out ~%ld(%ld%%) ",
//    //       s->last_lit, in_length, out_length,
//    //       100L - out_length*100L/in_length));
//    if (s.matches < (s.last_lit>>1)/*int /2*/ && out_length < (in_length>>1)/*int /2*/) {
//      return true;
//    }
//  }
//#endif

  return (s.last_lit === s.lit_bufsize-1);
  /* We avoid equality with lit_bufsize because of wraparound at 64K
   * on 16 bit machines and because stored blocks are restricted to
   * 64K-1 bytes.
   */
}

exports._tr_init  = _tr_init;
exports._tr_stored_block = _tr_stored_block;
exports._tr_flush_block  = _tr_flush_block;
exports._tr_tally = _tr_tally;
exports._tr_align = _tr_align;

},{"../utils/common":31}],43:[function(require,module,exports){
'use strict';


function ZStream() {
  /* next input byte */
  this.input = null; // JS specific, because we have no pointers
  this.next_in = 0;
  /* number of bytes available at input */
  this.avail_in = 0;
  /* total number of input bytes read so far */
  this.total_in = 0;
  /* next output byte should be put there */
  this.output = null; // JS specific, because we have no pointers
  this.next_out = 0;
  /* remaining free space at output */
  this.avail_out = 0;
  /* total number of bytes output so far */
  this.total_out = 0;
  /* last error message, NULL if no error */
  this.msg = ''/*Z_NULL*/;
  /* not visible by applications */
  this.state = null;
  /* best guess about the data type: binary or text */
  this.data_type = 2/*Z_UNKNOWN*/;
  /* adler32 value of the uncompressed data */
  this.adler = 0;
}

module.exports = ZStream;

},{}],44:[function(require,module,exports){
//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

(function() {
  var _global = this;

  // Unique ID creation requires a high quality random # generator.  We feature
  // detect to determine the best RNG source, normalizing to a function that
  // returns 128-bits of randomness, since that's what's usually required
  var _rng;

  // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html
  //
  // Moderately fast, high quality
  if (typeof(_global.require) == 'function') {
    try {
      var _rb = _global.require('crypto').randomBytes;
      _rng = _rb && function() {return _rb(16);};
    } catch(e) {}
  }

  if (!_rng && _global.crypto && crypto.getRandomValues) {
    // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
    //
    // Moderately fast, high quality
    var _rnds8 = new Uint8Array(16);
    _rng = function whatwgRNG() {
      crypto.getRandomValues(_rnds8);
      return _rnds8;
    };
  }

  if (!_rng) {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random().  It's fast, but is of unspecified
    // quality.
    var  _rnds = new Array(16);
    _rng = function() {
      for (var i = 0, r; i < 16; i++) {
        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
        _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
      }

      return _rnds;
    };
  }

  // Buffer class to use
  var BufferClass = typeof(_global.Buffer) == 'function' ? _global.Buffer : Array;

  // Maps for number <-> hex string conversion
  var _byteToHex = [];
  var _hexToByte = {};
  for (var i = 0; i < 256; i++) {
    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
    _hexToByte[_byteToHex[i]] = i;
  }

  // **`parse()` - Parse a UUID into it's component bytes**
  function parse(s, buf, offset) {
    var i = (buf && offset) || 0, ii = 0;

    buf = buf || [];
    s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
      if (ii < 16) { // Don't overflow!
        buf[i + ii++] = _hexToByte[oct];
      }
    });

    // Zero out remaining bytes if string was short
    while (ii < 16) {
      buf[i + ii++] = 0;
    }

    return buf;
  }

  // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
  function unparse(buf, offset) {
    var i = offset || 0, bth = _byteToHex;
    return  bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]];
  }

  // **`v1()` - Generate time-based UUID**
  //
  // Inspired by https://github.com/LiosK/UUID.js
  // and http://docs.python.org/library/uuid.html

  // random #'s we need to init node and clockseq
  var _seedBytes = _rng();

  // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
  var _nodeId = [
    _seedBytes[0] | 0x01,
    _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
  ];

  // Per 4.2.2, randomize (14 bit) clockseq
  var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

  // Previous uuid creation time
  var _lastMSecs = 0, _lastNSecs = 0;

  // See https://github.com/broofa/node-uuid for API details
  function v1(options, buf, offset) {
    var i = buf && offset || 0;
    var b = buf || [];

    options = options || {};

    var clockseq = options.clockseq != null ? options.clockseq : _clockseq;

    // UUID timestamps are 100 nano-second units since the Gregorian epoch,
    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
    var msecs = options.msecs != null ? options.msecs : new Date().getTime();

    // Per 4.2.1.2, use count of uuid's generated during the current clock
    // cycle to simulate higher resolution clock
    var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;

    // Time since last uuid creation (in msecs)
    var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

    // Per 4.2.1.2, Bump clockseq on clock regression
    if (dt < 0 && options.clockseq == null) {
      clockseq = clockseq + 1 & 0x3fff;
    }

    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
    // time interval
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
      nsecs = 0;
    }

    // Per 4.2.1.2 Throw error if too many uuids are requested
    if (nsecs >= 10000) {
      throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
    }

    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;

    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
    msecs += 12219292800000;

    // `time_low`
    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[i++] = tl >>> 24 & 0xff;
    b[i++] = tl >>> 16 & 0xff;
    b[i++] = tl >>> 8 & 0xff;
    b[i++] = tl & 0xff;

    // `time_mid`
    var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
    b[i++] = tmh >>> 8 & 0xff;
    b[i++] = tmh & 0xff;

    // `time_high_and_version`
    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
    b[i++] = tmh >>> 16 & 0xff;

    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
    b[i++] = clockseq >>> 8 | 0x80;

    // `clock_seq_low`
    b[i++] = clockseq & 0xff;

    // `node`
    var node = options.node || _nodeId;
    for (var n = 0; n < 6; n++) {
      b[i + n] = node[n];
    }

    return buf ? buf : unparse(b);
  }

  // **`v4()` - Generate random UUID**

  // See https://github.com/broofa/node-uuid for API details
  function v4(options, buf, offset) {
    // Deprecated - 'format' argument, as supported in v1.2
    var i = buf && offset || 0;

    if (typeof(options) == 'string') {
      buf = options == 'binary' ? new BufferClass(16) : null;
      options = null;
    }
    options = options || {};

    var rnds = options.random || (options.rng || _rng)();

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    // Copy bytes to buffer, if provided
    if (buf) {
      for (var ii = 0; ii < 16; ii++) {
        buf[i + ii] = rnds[ii];
      }
    }

    return buf || unparse(rnds);
  }

  // Export public API
  var uuid = v4;
  uuid.v1 = v1;
  uuid.v4 = v4;
  uuid.parse = parse;
  uuid.unparse = unparse;
  uuid.BufferClass = BufferClass;

  if (typeof(module) != 'undefined' && module.exports) {
    // Publish as node.js module
    module.exports = uuid;
  } else  if (typeof define === 'function' && define.amd) {
    // Publish as AMD module
    define(function() {return uuid;});
 

  } else {
    // Publish as global (in browsers)
    var _previousRoot = _global.uuid;

    // **`noConflict()` - (browser only) to reset global 'uuid' var**
    uuid.noConflict = function() {
      _global.uuid = _previousRoot;
      return uuid;
    };

    _global.uuid = uuid;
  }
}).call(this);

},{}],45:[function(require,module,exports){
'use strict';

var Registry = require("./core/registry");
var Device = require('./core/device');
var Layer = require('./core/layer');
var PaperView = require("./view/paperView");
var ViewManager = require("./view/viewManager");
var AdaptiveGrid = require("./view/grid/adaptiveGrid");
var PageSetup = require("./view/pageSetup");
var Colors = require("./view/colors");
var ThreeDeviceRenderer = require("./view/render3D/ThreeDeviceRenderer");
var Examples = require("./examples/jsonExamples");

var view;
var viewManager;
var grid;

paper.setup("c");

window.onload = function () {
    view = new PaperView(document.getElementById("c"));
    viewManager = new ViewManager(view);
    grid = new AdaptiveGrid();
    grid.setColor(Colors.BLUE_500);

    Registry.viewManager = viewManager;

  // Load last uploaded file  to canvas
  $.getJSON("../uploads/myjson.json", function (json) {
    viewManager.loadDeviceFromJSON(JSON.parse(JSON.stringify((json))));
    viewManager.updateGrid();
    Registry.currentDevice.updateView();
  });


    // viewManager.loadDeviceFromJSON(JSON.parse(Examples.example1));
    // viewManager.updateGrid();
    // Registry.currentDevice.updateView();

    window.dev = Registry.currentDevice;
    window.Registry = Registry;

    window.view = Registry.viewManager.view;

    Registry.threeRenderer = new ThreeDeviceRenderer(document.getElementById("renderContainer"));
    PageSetup.setupAppPage();
};

},{"./core/device":46,"./core/layer":48,"./core/registry":57,"./examples/jsonExamples":58,"./view/colors":72,"./view/grid/adaptiveGrid":73,"./view/pageSetup":74,"./view/paperView":75,"./view/render3D/ThreeDeviceRenderer":81,"./view/viewManager":96}],46:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Params = require("./params");
var Parameters = require("./parameters");
var Parameter = require("./parameter");
var Feature = require('./feature');
var Layer = require('./layer');
var Registry = require("./registry");

var StringValue = Parameters.StringValue;
var FloatValue = Parameters.FloatValue;

/* The Device stores information about a design. */

var Device = (function () {
    function Device(values) {
        var name = arguments.length <= 1 || arguments[1] === undefined ? "New Device" : arguments[1];

        _classCallCheck(this, Device);

        this.layers = [];
        this.params = new Params(values, Device.getUniqueParameters(), Device.getHeritableParameters());
        this.name = StringValue(name);
    }

    _createClass(Device, [{
        key: "setName",
        value: function setName(name) {
            this.name = StringValue(name);
            this.updateView();
        }
    }, {
        key: "updateParameter",
        value: function updateParameter(key, value) {
            this.params.updateParameter(key, value);
            this.updateView();
        }

        /* Sort the layers such that they are ordered from lowest to highest z_offset. */
    }, {
        key: "sortLayers",
        value: function sortLayers() {
            this.layers.sort(function (a, b) {
                return a.params.getValue("z_offset") - b.params.getValue("z_offset");
            });
        }
    }, {
        key: "getLayerFromFeatureID",
        value: function getLayerFromFeatureID(featureID) {
            for (var i = 0; i < this.layers.length; i++) {
                var layer = this.layers[i];
                if (layer.containsFeatureID(featureID)) {
                    return layer;
                }
            }
            throw new Error("FeatureID " + featureID + " not found in any layer.");
        }
    }, {
        key: "containsFeatureID",
        value: function containsFeatureID(featureID) {
            for (var i = 0; i < this.layers.length; i++) {
                if (this.layers[i].containsFeatureID(featureID)) return true;
            }
            return false;
        }
    }, {
        key: "getFeatureByID",
        value: function getFeatureByID(featureID) {
            var layer = this.getLayerFromFeatureID(featureID);
            return layer.getFeature(featureID);
        }

        /* Add a layer, and re-sort the layers array.*/
    }, {
        key: "addLayer",
        value: function addLayer(layer) {
            layer.device = this;
            this.layers.push(layer);
            this.sortLayers();
            if (Registry.viewManager) Registry.viewManager.addLayer(this.layers.indexOf(layer));
        }
    }, {
        key: "removeFeature",
        value: function removeFeature(feature) {
            this.removeFeatureByID(feature.getID());
        }
    }, {
        key: "removeFeatureByID",
        value: function removeFeatureByID(featureID) {
            var layer = this.getLayerFromFeatureID(featureID);
            layer.removeFeatureByID(featureID);
        }
    }, {
        key: "updateViewLayers",
        value: function updateViewLayers() {
            if (Registry.viewManager) Registry.viewManager.updateLayers(this);
        }
    }, {
        key: "updateView",
        value: function updateView() {
            if (Registry.viewManager) Registry.viewManager.updateDevice(this);
        }
    }, {
        key: "__renderLayers2D",
        value: function __renderLayers2D() {
            var output = [];
            for (var i = 0; i < this.layers.length; i++) {
                output.push(this.layers[i].render2D());
            }
            return output;
        }
    }, {
        key: "__groupsToJSON",
        value: function __groupsToJSON() {
            var output = [];
            for (var i in this.groups) {
                output.push(this.groups[i].toJSON());
            }
            return output;
        }
    }, {
        key: "__layersToJSON",
        value: function __layersToJSON() {
            var output = [];
            for (var i in this.layers) {
                output.push(this.layers[i].toJSON());
            }
            return output;
        }
    }, {
        key: "__loadLayersFromJSON",
        value: function __loadLayersFromJSON(json) {
            for (var i in json) {
                var newLayer = Layer.fromJSON(json[i]);
                this.addLayer(newLayer);
            }
        }
    }, {
        key: "toJSON",
        value: function toJSON() {
            var output = {};
            output.name = this.name.toJSON();
            output.params = this.params.toJSON();
            output.layers = this.__layersToJSON();
            output.groups = this.__groupsToJSON();
            output.defaults = this.defaults;
            return output;
        }
    }, {
        key: "render2D",
        value: function render2D() {
            return this.__renderLayers2D();
        }
    }], [{
        key: "getUniqueParameters",
        value: function getUniqueParameters() {
            return {
                "height": "Float",
                "width": "Float"
            };
        }
    }, {
        key: "getHeritableParameters",
        value: function getHeritableParameters() {
            return {};
        }
    }, {
        key: "fromJSON",
        value: function fromJSON(json) {
            var defaults = json.defaults;
            var newDevice = new Device({
                "width": json.params.width,
                "height": json.params.height
            }, json.name);
            newDevice.__loadLayersFromJSON(json.layers);
            return newDevice;
        }
    }]);

    return Device;
})();

module.exports = Device;

},{"./feature":47,"./layer":48,"./parameter":49,"./parameters":52,"./params":56,"./registry":57}],47:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Params = require('./params');
var Parameters = require('./parameters');
var Parameter = require("./parameter");
var StringValue = Parameters.StringValue;
var FeatureSets = require("../featureSets");
var Registry = require("./registry");

var registeredFeatureTypes = {};

var Feature = (function () {
    function Feature(type, set, params, name) {
        var id = arguments.length <= 4 || arguments[4] === undefined ? Feature.generateID() : arguments[4];

        _classCallCheck(this, Feature);

        this.__type = type;
        this.__params = params;
        this.__name = StringValue(name);
        this.__id = id;
        this.__type = type;
        this.__set = set;
    }

    _createClass(Feature, [{
        key: 'updateParameter',
        value: function updateParameter(key, value) {
            this.__params.updateParameter(key, value);
            this.updateView();
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var output = {};
            output.id = this.__id;
            output.name = this.__name.toJSON();
            output.type = this.__type;
            output.set = this.__set;
            output.params = this.__params.toJSON();
            return output;
        }
    }, {
        key: 'getSet',
        value: function getSet() {
            return this.__set;
        }
    }, {
        key: 'getID',
        value: function getID() {
            return this.__id;
        }
    }, {
        key: 'setName',
        value: function setName(name) {
            this.__name = StringValue(name);
        }
    }, {
        key: 'getName',
        value: function getName() {
            return this.__name.getValue();
        }
    }, {
        key: 'getType',
        value: function getType() {
            return this.__type;
        }
    }, {
        key: 'getValue',
        value: function getValue(key) {
            try {
                return this.__params.getValue(key);
            } catch (err) {
                if (this.hasDefaultParam(key)) return this.getDefaults()[key];else throw new Error("Unable to get value for key: " + key);
            }
        }
    }, {
        key: 'hasDefaultParam',
        value: function hasDefaultParam(key) {
            if (this.getDefaults().hasOwnProperty(key)) return true;else return false;
        }
    }, {
        key: 'hasUniqueParam',
        value: function hasUniqueParam(key) {
            return this.__params.isUnique(key);
        }
    }, {
        key: 'hasHeritableParam',
        value: function hasHeritableParam(key) {
            return this.__params.isHeritable(key);
        }
    }, {
        key: 'getHeritableParams',
        value: function getHeritableParams() {
            return Feature.getDefinitionForType(this.getType(), this.getSet()).heritable;
        }
    }, {
        key: 'getUniqueParams',
        value: function getUniqueParams() {
            return Feature.getDefinitionForType(this.getType(), this.getSet()).unique;
        }
    }, {
        key: 'getDefaults',
        value: function getDefaults() {
            return Feature.getDefaultsForType(this.getType(), this.getSet());
        }
    }, {
        key: 'updateView',
        value: function updateView() {
            if (Registry.viewManager) Registry.viewManager.updateFeature(this);
        }

        //I wish I had abstract methods. :(
    }, {
        key: 'render2D',
        value: function render2D() {
            throw new Error("Base class Feature cannot be rendered in 2D.");
        }
    }], [{
        key: 'generateID',
        value: function generateID() {
            return Registry.generateID();
        }
    }, {
        key: 'getFeatureGenerator',
        value: function getFeatureGenerator(typeString, setString) {
            return function (values) {
                return Feature.makeFeature(typeString, setString, values);
            };
        }
    }, {
        key: 'getDefaultsForType',
        value: function getDefaultsForType(typeString, setString) {
            return Registry.featureDefaults[setString][typeString];
        }
    }, {
        key: 'getDefinitionForType',
        value: function getDefinitionForType(typeString, setString) {
            return FeatureSets.getDefinition(typeString, setString);
        }
    }, {
        key: 'checkDefaults',
        value: function checkDefaults(values, heritable, defaults) {
            for (var key in heritable) {
                if (!values.hasOwnProperty(key)) values[key] = defaults[key];
            }
            return values;
        }
    }, {
        key: 'fromJSON',
        value: function fromJSON(json) {
            var set = undefined;
            if (json.hasOwnProperty("set")) set = json.set;else set = "Basic";
            return Feature.makeFeature(json.type, set, json.params, json.name, json.id);
        }
    }, {
        key: 'makeFeature',
        value: function makeFeature(typeString, setString, values) {
            var name = arguments.length <= 3 || arguments[3] === undefined ? "New Feature" : arguments[3];
            var id = arguments.length <= 4 || arguments[4] === undefined ? undefined : arguments[4];

            var featureType = FeatureSets.getDefinition(typeString, setString);
            Feature.checkDefaults(values, featureType.heritable, Feature.getDefaultsForType(typeString, setString));
            var params = new Params(values, featureType.unique, featureType.heritable);
            return new Feature(typeString, setString, params, name, id);
        }
    }]);

    return Feature;
})();

module.exports = Feature;

},{"../featureSets":65,"./parameter":49,"./parameters":52,"./params":56,"./registry":57}],48:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Params = require('./params');
var Parameters = require('./parameters');
var Feature = require('./feature');
var Registry = require("./registry");

var FloatValue = Parameters.FloatValue;
var BooleanValue = Parameters.BooleanValue;
var StringValue = Parameters.StringValue;

var Layer = (function () {
    function Layer(values) {
        var name = arguments.length <= 1 || arguments[1] === undefined ? "New Layer" : arguments[1];

        _classCallCheck(this, Layer);

        this.params = new Params(values, Layer.getUniqueParameters(), Layer.getHeritableParameters());
        this.name = StringValue(name);
        this.features = {};
        this.featureCount = 0;
        this.device = undefined;
        this.color = undefined;
    }

    _createClass(Layer, [{
        key: 'addFeature',
        value: function addFeature(feature) {
            this.__ensureIsAFeature(feature);
            this.features[feature.getID()] = feature;
            this.featureCount += 1;
            feature.layer = this;
            if (Registry.viewManager) Registry.viewManager.addFeature(feature);
        }
    }, {
        key: 'updateParameter',
        value: function updateParameter(key, value) {
            this.params.updateParameter(key, value);
            if (Registry.viewManager) Registry.viewManager.updateLayer(this);
        }
    }, {
        key: 'setColor',
        value: function setColor(layerColor) {
            this.color = layerColor;
            if (Registry.viewManager) Registry.viewManager.updateLayer(this);
        }
    }, {
        key: 'getIndex',
        value: function getIndex() {
            if (this.device) return this.device.layers.indexOf(this);
        }
    }, {
        key: 'estimateLayerHeight',
        value: function estimateLayerHeight() {
            var dev = this.device;
            var flip = this.params.getValue("flip");
            var offset = this.params.getValue("z_offset");
            if (dev) {
                var thisIndex = this.getIndex();
                var targetIndex = undefined;
                if (flip) targetIndex = thisIndex - 1;else targetIndex = thisIndex + 1;
                if (thisIndex >= 0 || thisIndex <= dev.layers.length - 1) {
                    var targetLayer = dev.layers[targetIndex];
                    return Math.abs(offset - targetLayer.params.getValue("z_offset"));
                } else {
                    if (thisIndex - 1 >= 0) {
                        var targetLayer = dev.layers[thisIndex - 1];
                        return targetLayer.estimateLayerHeight();
                    }
                }
            }
            return 0;
        }
    }, {
        key: '__ensureIsAFeature',
        value: function __ensureIsAFeature(feature) {
            if (!(feature instanceof Feature)) {
                throw new Error("Provided value" + feature + " is not a Feature! Did you pass an ID by mistake?");
            }
        }
    }, {
        key: '__ensureFeatureExists',
        value: function __ensureFeatureExists(feature) {
            if (!this.containsFeature(feature)) throw new Error("Layer does not contain the specified feature!");
        }
    }, {
        key: '__ensureFeatureIDExists',
        value: function __ensureFeatureIDExists(featureID) {
            if (!this.containsFeatureID(featureID)) throw new Error("Layer does not contain a feature with the specified ID!");
        }
    }, {
        key: 'getFeature',
        value: function getFeature(featureID) {
            this.__ensureFeatureIDExists(featureID);
            return this.features[featureID];
        }
    }, {
        key: 'removeFeature',
        value: function removeFeature(feature) {
            this.removeFeatureByID(feature.getID());
        }

        //TODO: Stop using delete, it's slow!
    }, {
        key: 'removeFeatureByID',
        value: function removeFeatureByID(featureID) {
            this.__ensureFeatureIDExists(featureID);
            var feature = this.features[featureID];
            this.featureCount -= 1;
            if (Registry.viewManager) Registry.viewManager.removeFeature(feature);
            delete this.features[featureID];
        }
    }, {
        key: 'containsFeature',
        value: function containsFeature(feature) {
            this.__ensureIsAFeature(feature);
            return this.features.hasOwnProperty(feature.getID());
        }
    }, {
        key: 'containsFeatureID',
        value: function containsFeatureID(featureID) {
            return this.features.hasOwnProperty(featureID);
        }
    }, {
        key: '__renderFeatures2D',
        value: function __renderFeatures2D() {
            var output = [];
            for (var i in this.features) {
                output.push(this.features[i].render2D());
            }
            return output;
        }
    }, {
        key: '__featuresToJSON',
        value: function __featuresToJSON() {
            var output = {};
            for (var i in this.features) {
                output[i] = this.features[i].toJSON();
            }
            return output;
        }
    }, {
        key: '__loadFeaturesFromJSON',
        value: function __loadFeaturesFromJSON(json) {
            for (var i in json) {
                this.addFeature(Feature.fromJSON(json[i]));
            }
        }

        //TODO: Replace Params and remove static method
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var output = {};
            output.name = this.name.toJSON();
            output.color = this.color;
            output.params = this.params.toJSON();
            output.features = this.__featuresToJSON();
            return output;
        }
    }, {
        key: 'render2D',
        value: function render2D(paperScope) {
            return this.__renderFeatures2D();
        }
    }], [{
        key: 'getUniqueParameters',
        value: function getUniqueParameters() {
            return {
                "z_offset": "Float",
                "flip": "Boolean"
            };
        }
    }, {
        key: 'getHeritableParameters',
        value: function getHeritableParameters() {
            return {};
        }
    }, {
        key: 'fromJSON',
        value: function fromJSON(json) {
            if (!json.hasOwnProperty("features")) {
                throw new Error("JSON layer has no features!");
            }
            var newLayer = new Layer(json.params, json.name);
            newLayer.__loadFeaturesFromJSON(json.features);
            if (json.color) newLayer.color = json.color;
            return newLayer;
        }
    }]);

    return Layer;
})();

module.exports = Layer;

},{"./feature":47,"./parameters":52,"./params":56,"./registry":57}],49:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Registry = require("./registry");

var Parameter = (function () {
    function Parameter(type, value) {
        _classCallCheck(this, Parameter);

        Parameter.checkValue(type, value);
        this.__type = type;
        this.__value = value;
    }

    _createClass(Parameter, [{
        key: "toJSON",
        value: function toJSON() {
            return this.__value;
        }
    }, {
        key: "getValue",
        value: function getValue() {
            return this.__value;
        }
    }, {
        key: "getType",
        value: function getType() {
            return this.__type;
        }
    }, {
        key: "updateValue",
        value: function updateValue(value) {
            Parameter.checkValue(this.__type, value);
            this.__value = value;
        }

        //Takes a typestring to recognize that param type, and
        // an isValid function which returns true if a value is OK for
        // that type.
    }], [{
        key: "checkValue",
        value: function checkValue(type, value) {
            var paramType = Registry.registeredParams[type];
            if (paramType.isValid(value)) return true;else throw new Error("Saw value: " + value + ". " + paramType.description);
        }
    }, {
        key: "registerParamType",
        value: function registerParamType(typeString, isValid, description) {
            Registry.registeredParams[typeString] = {
                isValid: isValid,
                description: description
            };
        }
    }, {
        key: "makeParam",
        value: function makeParam(type, value) {
            if (Registry.registeredParams.hasOwnProperty(type)) {
                return new Parameter(type, value);
            } else {
                throw new Error("Type " + type + " has not been registered.");
            }
        }
    }, {
        key: "fromJSON",
        value: function fromJSON(json) {
            return Parameter.makeParam(json.type, json.value);
        }
    }]);

    return Parameter;
})();

module.exports = Parameter;

},{"./registry":57}],50:[function(require,module,exports){
"use strict";

var Parameter = require("../parameter");

var typeString = "Boolean";

var description = "BooleanValue must be true or false.";

function isValid(value) {
    if (typeof value === "boolean") return true;else return false;
}

Parameter.registerParamType(typeString, isValid, description);

},{"../parameter":49}],51:[function(require,module,exports){
"use strict";

var Parameter = require("../parameter");
var NumberUtils = require("../../utils/numberUtils");

var typeString = "Float";

var description = 'FloatValue must be a number >= 0, such as 3.827';

function isValid(value) {
    if (typeof value === "number" && NumberUtils.isFloatOrInt(value) && value >= 0) return true;else return false;
}

Parameter.registerParamType(typeString, isValid, description);

},{"../../utils/numberUtils":68,"../parameter":49}],52:[function(require,module,exports){
"use strict";

var Parameter = require("../parameter");

require("./floatValue");
require("./booleanValue");
require("./integerValue");
require("./pointValue");
require("./stringValue");

module.exports.BooleanValue = function (value) {
	return Parameter.makeParam("Boolean", value);
};
module.exports.FloatValue = function (value) {
	return Parameter.makeParam("Float", value);
};
module.exports.IntegerValue = function (value) {
	return Parameter.makeParam("Integer", value);
};
module.exports.PointValue = function (value) {
	return Parameter.makeParam("Point", value);
};
module.exports.StringValue = function (value) {
	return Parameter.makeParam("String", value);
};

},{"../parameter":49,"./booleanValue":50,"./floatValue":51,"./integerValue":53,"./pointValue":54,"./stringValue":55}],53:[function(require,module,exports){
"use strict";

var Parameter = require("../parameter");
var NumberUtils = require("../../utils/numberUtils");

var typeString = "Integer";

var description = "FloatValue must be an integer >= 0.";

function isValid(value) {
    if (typeof value === 'number' && NumberUtils.isInteger(value) && value >= 0) return true;else return false;
}

Parameter.registerParamType(typeString, isValid, description);

},{"../../utils/numberUtils":68,"../parameter":49}],54:[function(require,module,exports){
"use strict";

var Parameter = require("../parameter");
var NumberUtils = require("../../utils/numberUtils");

var typeString = "Point";
var description = "PointValue must be an array containing exactly two numbers, such as [3,-5]";

function isValid(value) {
    if (value instanceof Array && value.length == 2 && NumberUtils.isFloatOrInt(value[0]) && NumberUtils.isFloatOrInt(value[1])) return true;else return false;
}

Parameter.registerParamType(typeString, isValid, description);

},{"../../utils/numberUtils":68,"../parameter":49}],55:[function(require,module,exports){
"use strict";

var Parameter = require("../parameter");

var typeString = "String";
var description = "StringValue must be a String, such as 'foobar'";

function isValid(value) {
    if (typeof value === 'string') return true;else return false;
}

Parameter.registerParamType(typeString, isValid, description);

},{"../parameter":49}],56:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Parameter = require("./parameter");

var Params = (function () {
    function Params(values, unique, heritable) {
        _classCallCheck(this, Params);

        this.unique = unique;
        this.heritable = heritable;
        this.parameters = this.__sanitizeValues(values);
    }

    _createClass(Params, [{
        key: "updateParameter",
        value: function updateParameter(key, value) {
            if (this.parameters.hasOwnProperty(key)) this.parameters[key].updateValue(value);else {
                if (this.isHeritable(key)) {
                    this.parameters[key] = Parameter.makeParam(this.heritable[key], value);
                } else throw new Error(key + "parameter does not exist in Params object");
            }
        }
    }, {
        key: "__ensureHasKey",
        value: function __ensureHasKey(key) {
            if (!this.parameters.hasOwnProperty(key)) throw new Error(key + " parameter not found in Params object.");
        }
    }, {
        key: "getValue",
        value: function getValue(key) {
            this.__ensureHasKey(key);
            return this.parameters[key].getValue();
        }
    }, {
        key: "getParameter",
        value: function getParameter(key) {
            this.__ensureHasKey(key);
            return this.parameters[key];
        }
    }, {
        key: "isUnique",
        value: function isUnique(key) {
            return this.unique.hasOwnProperty(key);
        }
    }, {
        key: "isHeritable",
        value: function isHeritable(key) {
            return this.heritable.hasOwnProperty(key);
        }
    }, {
        key: "hasAllUniques",
        value: function hasAllUniques(params) {
            for (var key in this.unique) {
                if (!params.hasOwnProperty(key)) return false;
            }return true;
        }
    }, {
        key: "wrongTypeError",
        value: function wrongTypeError(key, expected, actual) {
            return new Error("Parameter " + key + " is the wrong type. " + "Expected: " + this.unique[key] + ", Actual: " + actual);
        }

        /* Turns the raw key:value pairs passed into a user-written Feature declaration
        into key:Parameter pairs. This forces the checks for each Parameter type
        to execute on the provided values, and should throw an error for mismatches. */
    }, {
        key: "__sanitizeValues",
        value: function __sanitizeValues(values) {
            var newParams = {};
            for (var key in values) {
                var oldParam = values[key];
                if (this.isUnique(key)) {
                    newParams[key] = Parameter.makeParam(this.unique[key], oldParam);
                } else if (this.isHeritable(key)) {
                    if (values[key]) {
                        newParams[key] = Parameter.makeParam(this.heritable[key], oldParam);
                    }
                } else {
                    throw new Error(key + " does not exist in this set of ParamTypes: " + Object.keys(this.unique) + Object.keys(this.heritable));
                }
            }
            this.__checkParams(newParams);
            return newParams;
        }

        /* Checks to make sure the set of sanitized parameters matches the expected ParamTypes.
        This method also checks to make sure that all unique (required) params are present.*/
    }, {
        key: "__checkParams",
        value: function __checkParams(parameters) {
            for (var key in parameters) {
                var param = parameters[key];
                if (!(param instanceof Parameter)) {
                    throw new Error(key + " is not a ParameterValue.");
                } else if (this.isUnique(key)) {
                    if (param.type != this.unique[key]) {
                        this.wrongTypeError(key, this.unique[key], param.type);
                    }
                } else if (this.isHeritable(key)) {
                    if (param.type != this.heritable[key]) {
                        this.wrongTypeError(key, this.heritable[key], param.type);
                    }
                } else {
                    throw new Error(key + " does not exist in this set of ParamTypes.");
                }
            }
            if (!this.hasAllUniques(parameters)) {
                throw new Error("Unique values were not present in the provided parameters. Expected: " + Object.keys(this.unique) + ", saw: " + Object.keys(parameters));
            }
        }
    }, {
        key: "toJSON",
        value: function toJSON() {
            var json = {};
            for (var key in this.parameters) {
                json[key] = this.parameters[key].getValue();
            }
            return json;
        }
    }], [{
        key: "fromJSON",
        value: function fromJSON(json, unique, heritable) {
            return new Params(json, unique, heritable);
        }
    }]);

    return Params;
})();

module.exports = Params;

},{"./parameter":49}],57:[function(require,module,exports){
'use strict';

var uuid = require('node-uuid');

var registeredParams = {};
var featureDefaults = {};
var currentDevice = null;
var canvasManager = null;
var currentLayer = null;
var currentGrid = null;
var view = null;
var viewManager = null;
var id_counter = 0;
var threeRenderer = null;

var generateID = function generateID() {
    return uuid.v1();
};

exports.generateID = generateID;
exports.registeredParams = registeredParams;
exports.currentDevice = currentDevice;
exports.currentLayer = currentLayer;
exports.canvasManager = canvasManager;
exports.viewManager = viewManager;
exports.currentGrid = currentGrid;
exports.featureDefaults = featureDefaults;
exports.threeRenderer = threeRenderer;

},{"node-uuid":44}],58:[function(require,module,exports){
'use strict';

module.exports.example1 = '{"name":"My Device","params":{"width":75800,"height":51000},"layers":[{"name":"flow","color":"indigo","params":{"z_offset":0,"flip":false},"features":{"97f1fd20-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f1fd20-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[30000,40000],"radius1":700,"radius2":700,"height":100}},"97f1fd21-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f1fd21-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[40000,40000],"radius1":700,"radius2":700,"height":100}},"97f22430-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f22430-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[50000,40000],"radius1":700,"radius2":700,"height":100}},"97f22431-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f22431-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[20000,40000],"radius1":700,"radius2":700,"height":100}},"97f22432-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f22432-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[20000,40000],"end":[20000,35000],"width":400,"height":100}},"97f22433-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f22433-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[20000,38000],"end":[17000,38000],"width":400,"height":100}},"97f22434-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f22434-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[17000,38000],"end":[17000,35000],"width":400,"height":100}},"97f22435-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f22435-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[20000,35000],"end":[20000,20000],"width":400,"height":100}},"97f22436-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f22436-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[20000,20000],"end":[10000,10000],"width":400,"height":100}},"97f22437-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f22437-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[17000,35000],"end":[15000,30000],"width":400,"height":100}},"97f22438-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f22438-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[15000,30000],"end":[10000,30000],"width":400,"height":100}},"97f22439-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f22439-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[10000,30000],"end":[10000,28000],"width":400,"height":100}},"97f2243a-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2243a-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[10000,28000],"end":[15000,28000],"width":400,"height":100}},"97f2243b-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2243b-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[15000,28000],"end":[15000,25000],"width":400,"height":100}},"97f2243c-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2243c-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[15000,25000],"end":[8000,25000],"width":400,"height":100}},"97f2243d-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2243d-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[8000,25000],"radius1":700,"radius2":700,"height":100}},"97f2243e-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2243e-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[10000,10000],"radius1":700,"radius2":700,"height":100}},"97f2243f-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2243f-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[30000,40000],"end":[30000,20000],"width":400,"height":100}},"97f22440-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f22440-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[30000,20000],"end":[20000,10000],"width":400,"height":100}},"97f22441-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f22441-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[20000,10000],"radius1":700,"radius2":700,"height":100}},"97f22442-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f22442-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[30000,38000],"end":[27000,38000],"width":400,"height":100}},"97f22443-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f22443-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[27000,38000],"end":[27000,30000],"width":400,"height":100}},"97f22444-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f22444-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[27000,30000],"end":[22000,30000],"width":400,"height":100}},"97f22445-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f22445-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[22000,30000],"end":[22000,28000],"width":400,"height":100}},"97f22446-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f22446-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[22000,28000],"end":[27000,28000],"width":400,"height":100}},"97f24b40-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b40-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[27000,28000],"end":[27000,26000],"width":400,"height":100}},"97f24b41-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b41-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[27000,26000],"end":[22000,26000],"width":400,"height":100}},"97f24b42-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b42-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[22000,26000],"end":[22000,24000],"width":400,"height":100}},"97f24b43-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b43-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[22000,24000],"end":[27000,24000],"width":400,"height":100}},"97f24b44-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b44-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[27000,24000],"end":[27000,22000],"width":400,"height":100}},"97f24b45-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b45-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[27000,22000],"end":[22000,22000],"width":400,"height":100}},"97f24b46-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b46-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[22000,22000],"end":[22000,20000],"width":400,"height":100}},"97f24b47-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b47-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[22000,20000],"end":[25000,20000],"width":400,"height":100}},"97f24b48-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b48-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[25000,20000],"end":[25000,17000],"width":400,"height":100}},"97f24b49-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b49-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[25000,17000],"end":[21000,17000],"width":400,"height":100}},"97f24b4a-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b4a-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[21000,17000],"radius1":700,"radius2":700,"height":100}},"97f24b4b-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b4b-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[40000,40000],"end":[40000,20000],"width":400,"height":100}},"97f24b4c-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b4c-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[40000,20000],"end":[50000,10000],"width":400,"height":100}},"97f24b4d-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b4d-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[40000,38000],"end":[43000,38000],"width":400,"height":100}},"97f24b4e-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b4e-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[43000,38000],"end":[43000,30000],"width":400,"height":100}},"97f24b4f-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b4f-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[43000,30000],"end":[48000,30000],"width":400,"height":100}},"97f24b50-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b50-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[48000,30000],"end":[48000,28000],"width":400,"height":100}},"97f24b51-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b51-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[48000,28000],"end":[43000,28000],"width":400,"height":100}},"97f24b52-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b52-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[43000,28000],"end":[43000,26000],"width":400,"height":100}},"97f24b53-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b53-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[43000,26000],"end":[48000,26000],"width":400,"height":100}},"97f24b54-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b54-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[48000,26000],"end":[48000,24000],"width":400,"height":100}},"97f24b55-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b55-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[48000,24000],"end":[43000,24000],"width":400,"height":100}},"97f24b56-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b56-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[43000,24000],"end":[43000,22000],"width":400,"height":100}},"97f24b57-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b57-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[43000,22000],"end":[48000,22000],"width":400,"height":100}},"97f24b58-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b58-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[48000,22000],"end":[48000,20000],"width":400,"height":100}},"97f24b59-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b59-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[48000,20000],"end":[45000,20000],"width":400,"height":100}},"97f24b5a-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b5a-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[45000,20000],"end":[45000,17000],"width":400,"height":100}},"97f24b5b-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b5b-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[45000,17000],"end":[49000,17000],"width":400,"height":100}},"97f24b5c-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b5c-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[50000,10000],"radius1":700,"radius2":700,"height":100}},"97f24b5d-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b5d-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[49000,17000],"radius1":700,"radius2":700,"height":100}},"97f24b5e-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b5e-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[50000,40000],"end":[50000,20000],"width":400,"height":100}},"97f24b5f-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b5f-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[50000,20000],"end":[60000,10000],"width":400,"height":100}},"97f24b60-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f24b60-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[60000,10000],"radius1":700,"radius2":700,"height":100}},"97f27250-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27250-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[50000,38000],"end":[53000,38000],"width":400,"height":100}},"97f27251-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27251-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[53000,38000],"end":[53000,35000],"width":400,"height":100}},"97f27252-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27252-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[53000,35000],"end":[55000,30000],"width":400,"height":100}},"97f27253-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27253-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[55000,30000],"end":[60000,30000],"width":400,"height":100}},"97f27254-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27254-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[60000,30000],"end":[60000,28000],"width":400,"height":100}},"97f27255-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27255-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[60000,28000],"end":[55000,28000],"width":400,"height":100}},"97f27256-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27256-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[55000,28000],"end":[55000,25000],"width":400,"height":100}},"97f27257-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27257-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[55000,25000],"end":[62000,25000],"width":400,"height":100}},"97f27258-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27258-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[62000,25000],"radius1":700,"radius2":700,"height":100}},"97f27259-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27259-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[15000,15000],"end":[15000,12000],"width":400,"height":100}},"97f2725a-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2725a-3ea6-11e5-8298-1b576ed4eb08","name":"New Via","type":"Via","params":{"position":[15000,12000],"radius1":800,"radius2":700,"height":1100}},"97f2725b-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2725b-3ea6-11e5-8298-1b576ed4eb08","name":"New Via","type":"Via","params":{"position":[26000,12000],"radius1":800,"radius2":700,"height":1100}},"97f2725c-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2725c-3ea6-11e5-8298-1b576ed4eb08","name":"New Via","type":"Via","params":{"position":[44000,12000],"radius1":800,"radius2":700,"height":1100}},"97f2725d-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2725d-3ea6-11e5-8298-1b576ed4eb08","name":"New Via","type":"Via","params":{"position":[55000,12000],"radius1":800,"radius2":700,"height":1100}},"97f2725e-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2725e-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[55000,12000],"end":[55000,15000],"width":400,"height":100}},"97f2725f-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2725f-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[26000,12000],"end":[30000,10000],"width":400,"height":100}},"97f27260-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27260-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[44000,12000],"end":[40000,10000],"width":400,"height":100}},"97f27261-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27261-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[40000,10000],"end":[38000,7000],"width":400,"height":100}},"97f27262-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27262-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[30000,10000],"end":[32000,7000],"width":400,"height":100}},"97f27263-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27263-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[32000,7000],"radius1":700,"radius2":700,"height":100}},"97f27264-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27264-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[38000,7000],"radius1":700,"radius2":700,"height":100}},"97f27265-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27265-3ea6-11e5-8298-1b576ed4eb08","name":"New CircleValve","type":"CircleValve","params":{"position":[35000,10000],"radius1":1400,"radius2":1200,"height":800}},"97f27266-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27266-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[35000,10000],"end":[35000,30000],"width":400,"height":100}},"97f27267-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27267-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[35000,30000],"radius1":700,"radius2":700,"height":100}},"97f27268-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27268-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[35000,17000],"end":[38000,23000],"width":400,"height":100}},"97f27269-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27269-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[38000,23000],"end":[36000,25000],"width":400,"height":100}},"97f2726a-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2726a-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[36000,25000],"end":[35000,30000],"width":400,"height":100}},"97f2726b-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2726b-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[35000,17000],"end":[32000,23000],"width":400,"height":100}},"97f2726c-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2726c-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[32000,23000],"end":[34000,25000],"width":400,"height":100}},"97f2726d-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2726d-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[34000,25000],"end":[35000,30000],"width":400,"height":100}},"97f2726e-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2726e-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[32000,23000],"end":[35000,24000],"width":400,"height":100}},"97f2726f-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2726f-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[38000,23000],"end":[35000,24000],"width":400,"height":100}},"97f27270-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27270-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[25000,20000],"end":[28000,20000],"width":400,"height":100}},"97f27271-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27271-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[28000,20000],"end":[28000,22000],"width":400,"height":100}},"97f27272-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27272-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[28000,22000],"end":[27000,22000],"width":400,"height":100}},"97f27273-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27273-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[45000,20000],"end":[42000,20000],"width":400,"height":100}},"97f27274-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27274-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[42000,20000],"end":[42000,22000],"width":400,"height":100}},"97f27275-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27275-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[42000,22000],"end":[44000,22000],"width":400,"height":100}},"97f27276-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27276-3ea6-11e5-8298-1b576ed4eb08","name":"New Via","type":"Via","params":{"position":[35000,30000],"radius1":800,"radius2":700,"height":1100}},"97f27277-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27277-3ea6-11e5-8298-1b576ed4eb08","name":"New Via","type":"Via","params":{"position":[32000,20000],"radius1":800,"radius2":700,"height":1100}},"97f27278-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27278-3ea6-11e5-8298-1b576ed4eb08","name":"New Via","type":"Via","params":{"position":[38000,20000],"radius1":800,"radius2":700,"height":1100}},"a2de7790-3ea6-11e5-8298-1b576ed4eb08":{"id":"a2de7790-3ea6-11e5-8298-1b576ed4eb08","name":"New CircleValve","type":"CircleValve","params":{"position":[10000,20000],"radius1":1400,"radius2":1200,"height":800}},"a3d819d0-3ea6-11e5-8298-1b576ed4eb08":{"id":"a3d819d0-3ea6-11e5-8298-1b576ed4eb08","name":"New CircleValve","type":"CircleValve","params":{"position":[60000,20000],"radius1":1400,"radius2":1200,"height":800}}}},{"name":"control","color":"red","params":{"z_offset":1200,"flip":true},"features":{"97f27279-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f27279-3ea6-11e5-8298-1b576ed4eb08","name":"New CircleValve","type":"CircleValve","params":{"position":[20000,34000],"radius1":1400,"radius2":1200,"height":800}},"97f2727a-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2727a-3ea6-11e5-8298-1b576ed4eb08","name":"New CircleValve","type":"CircleValve","params":{"position":[30000,34000],"radius1":1400,"radius2":1200,"height":800}},"97f2727b-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2727b-3ea6-11e5-8298-1b576ed4eb08","name":"New CircleValve","type":"CircleValve","params":{"position":[40000,34000],"radius1":1400,"radius2":1200,"height":800}},"97f2727c-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2727c-3ea6-11e5-8298-1b576ed4eb08","name":"New CircleValve","type":"CircleValve","params":{"position":[50000,34000],"radius1":1400,"radius2":1200,"height":800}},"97f2727d-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2727d-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[20000,34000],"end":[24000,34000],"width":400,"height":100}},"97f2727e-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2727e-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[24000,34000],"end":[24000,47000],"width":400,"height":100}},"97f29960-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f29960-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[30000,34000],"end":[34000,34000],"width":400,"height":100}},"97f29961-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f29961-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[34000,34000],"end":[34000,47000],"width":400,"height":100}},"97f29962-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f29962-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[40000,34000],"end":[37000,34000],"width":400,"height":100}},"97f29963-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f29963-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[37000,34000],"end":[36000,34000],"width":400,"height":100}},"97f29964-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f29964-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[36000,34000],"end":[36000,47000],"width":400,"height":100}},"97f29965-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f29965-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[50000,34000],"end":[46000,34000],"width":400,"height":100}},"97f29966-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f29966-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[46000,34000],"end":[46000,47000],"width":400,"height":100}},"97f29967-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f29967-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[24000,47000],"radius1":700,"radius2":700,"height":100}},"97f29968-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f29968-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[34000,47000],"radius1":700,"radius2":700,"height":100}},"97f29969-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f29969-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[36000,47000],"radius1":700,"radius2":700,"height":100}},"97f2996a-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2996a-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[46000,47000],"radius1":700,"radius2":700,"height":100}},"97f2996b-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2996b-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[15000,12000],"end":[26000,12000],"width":400,"height":100}},"97f2996c-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2996c-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[44000,12000],"end":[55000,12000],"width":400,"height":100}},"97f2996d-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2996d-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[15000,12000],"radius1":700,"radius2":700,"height":100}},"97f2996e-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2996e-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[26000,12000],"radius1":700,"radius2":700,"height":100}},"97f2996f-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f2996f-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[44000,12000],"radius1":700,"radius2":700,"height":100}},"97f29970-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f29970-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[55000,12000],"radius1":700,"radius2":700,"height":100}},"97f29971-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f29971-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[25000,21000],"radius1":700,"radius2":700,"height":100}},"97f29972-3ea6-11e5-8298-1b576ed4eb08":{"id":"97f29972-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[45000,21000],"radius1":700,"radius2":700,"height":100}},"a54e6620-3ea6-11e5-8298-1b576ed4eb08":{"id":"a54e6620-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[10000,20000],"end":[15000,12000],"width":400,"height":100}},"a63ff210-3ea6-11e5-8298-1b576ed4eb08":{"id":"a63ff210-3ea6-11e5-8298-1b576ed4eb08","name":"New Channel","type":"Channel","params":{"start":[55000,12000],"end":[60000,20000],"width":400,"height":100}},"a7efc4f0-3ea6-11e5-8298-1b576ed4eb08":{"id":"a7efc4f0-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[10000,20000],"radius1":700,"radius2":700,"height":100}},"a8879820-3ea6-11e5-8298-1b576ed4eb08":{"id":"a8879820-3ea6-11e5-8298-1b576ed4eb08","name":"New Port","type":"Port","params":{"position":[60000,20000],"radius1":700,"radius2":700,"height":100}}}}],"groups":[],"defaults":{}}';

},{}],59:[function(require,module,exports){
"use strict";

var basicFeatures = {
    "Channel": {
        unique: {
            "start": "Point",
            "end": "Point"
        },
        heritable: {
            "width": "Float",
            "height": "Float"
        },
        defaults: {
            "width": .41 * 1000,
            "height": .1 * 1000
        },
        minimum: {
            "width": 10,
            "height": 10
        },
        maximum: {
            "width": 2000,
            "height": 1200
        }
    },
    "Chamber": {
        unique: {
            "start": "Point",
            "end": "Point"
        },
        heritable: {
            "borderWidth": "Float",
            "height": "Float"
        },
        defaults: {
            "borderWidth": .41 * 1000,
            "height": .1 * 1000
        },
        minimum: {
            "borderWidth": 10,
            "height": 10
        },
        maximum: {
            "borderWidth": 2000,
            "height": 1200
        }
    },
    "CircleValve": {
        unique: {
            "position": "Point"
        },
        heritable: {
            "radius1": "Float",
            "radius2": "Float",
            "height": "Float"
        },
        defaults: {
            "radius1": 1.4 * 1000,
            "radius2": 1.2 * 1000,
            "height": .8 * 1000
        },
        minimum: {
            "radius1": 10,
            "radius2": 10,
            "height": 10
        },
        maximum: {
            "radius1": 2000,
            "radius2": 2000,
            "height": 1200
        }
    },
    "Via": {
        unique: {
            "position": "Point"
        },
        heritable: {
            "radius1": "Float",
            "radius2": "Float",
            "height": "Float"
        },
        defaults: {
            "radius1": .8 * 1000,
            "radius2": .7 * 1000,
            "height": 1.1 * 1000
        },
        minimum: {
            "radius1": 10,
            "radius2": 10,
            "height": 10
        },
        maximum: {
            "radius1": 2000,
            "radius2": 2000,
            "height": 1200
        }
    },
    "Port": {
        unique: {
            "position": "Point"
        },
        heritable: {
            "radius1": "Float",
            "radius2": "Float",
            "height": "Float"
        },
        defaults: {
            "radius1": .7 * 1000,
            "radius2": .7 * 1000,
            "height": 1.1 * 1000
        },
        minimum: {
            "radius1": 10,
            "radius2": 10,
            "height": 10
        },
        maximum: {
            "radius1": 2000,
            "radius2": 2000,
            "height": 1200
        }
    }
};

module.exports = basicFeatures;

},{}],60:[function(require,module,exports){
"use strict";

module.exports.definitions = require("./definitions");
module.exports.render2D = require("./render2D");
module.exports.render3D = require("./render3D");
module.exports.tools = require("./tools");

},{"./definitions":59,"./render2D":61,"./render3D":62,"./tools":63}],61:[function(require,module,exports){
"use strict";

var render2D = {
    Via: {
        featureParams: {
            position: "position",
            radius1: "radius1",
            radius2: "radius2"
        },
        targetParams: {
            radius1: "radius1",
            radius2: "radius2"
        },
        featurePrimitiveSet: "Basic2D",
        featurePrimitiveType: "GradientCircle",
        targetPrimitiveType: "CircleTarget",
        targetPrimitiveSet: "Basic2D"
    },
    Port: {
        featureParams: {
            position: "position",
            radius1: "radius1",
            radius2: "radius2"
        },
        targetParams: {
            radius1: "radius1",
            radius2: "radius2"
        },
        featurePrimitiveSet: "Basic2D",
        featurePrimitiveType: "GradientCircle",
        targetPrimitiveType: "CircleTarget",
        targetPrimitiveSet: "Basic2D"
    },
    CircleValve: {
        featureParams: {
            position: "position",
            radius1: "radius1",
            radius2: "radius2"
        },
        targetParams: {
            radius1: "radius1",
            radius2: "radius2"
        },
        featurePrimitiveSet: "Basic2D",
        featurePrimitiveType: "GradientCircle",
        targetPrimitiveType: "CircleTarget",
        targetPrimitiveSet: "Basic2D"
    },
    Channel: {
        featureParams: {
            start: "start",
            end: "end",
            width: "width"
        },
        targetParams: {
            diameter: "width"
        },
        featurePrimitiveType: "RoundedRectLine",
        featurePrimitiveSet: "Basic2D",
        targetPrimitiveType: "CircleTarget",
        targetPrimitiveSet: "Basic2D"
    },
    Chamber: {
        featureParams: {
            start: "start",
            end: "end",
            borderWidth: "borderWidth"
        },
        targetParams: {
            diameter: "borderWidth"
        },
        featurePrimitiveSet: "Basic2D",
        featurePrimitiveType: "RoundedRect",
        targetPrimitiveSet: "Basic2D",
        targetPrimitiveType: "CircleTarget"
    }
};

module.exports = render2D;

},{}],62:[function(require,module,exports){
"use strict";

var render3D = {
    Via: {
        featureParams: {
            position: "position",
            radius1: "radius1",
            radius2: "radius2",
            height: "height"
        },
        featurePrimitiveSet: "Basic3D",
        featurePrimitive: "ConeFeature"
    },
    Port: {
        featureParams: {
            position: "position",
            radius1: "radius1",
            radius2: "radius2",
            height: "height"
        },
        featurePrimitiveSet: "Basic3D",
        featurePrimitive: "ConeFeature"
    },
    CircleValve: {
        featureParams: {
            position: "position",
            radius1: "radius1",
            radius2: "radius2",
            height: "height"
        },
        featurePrimitiveSet: "Basic3D",
        featurePrimitive: "ConeFeature"
    },
    Channel: {
        featureParams: {
            start: "start",
            end: "end",
            width: "width",
            height: "height"
        },
        featurePrimitiveSet: "Basic3D",
        featurePrimitive: "TwoPointRoundedLineFeature"
    },
    Chamber: {
        featureParams: {
            start: "start",
            end: "end",
            borderWidth: "borderWidth",
            height: "height"
        },
        featurePrimitiveSet: "Basic3D",
        featurePrimitive: "TwoPointRoundedBoxFeature"
    }
};

module.exports = render3D;

},{}],63:[function(require,module,exports){
"use strict";

var tools = {
    Via: {
        toolParams: {
            position: "position"
        },
        placementTool: "PositionTool"
    },
    Port: {
        toolParams: {
            position: "position"
        },
        placementTool: "PositionTool"
    },
    CircleValve: {
        toolParams: {
            position: "position"
        },
        placementTool: "PositionTool"
    },
    Channel: {
        toolParams: {
            start: "start",
            end: "end"
        },
        placementTool: "DragTool"
    },
    Chamber: {
        toolParams: {
            start: "start",
            end: "end"
        },
        placementTool: "DragTool"
    }
};

module.exports = tools;

},{}],64:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Feature = require("../core/feature");

var FeatureSet = (function () {
    function FeatureSet(definitions, tools, render2D, render3D, setString) {
        _classCallCheck(this, FeatureSet);

        this.__definitions = definitions;
        this.__setString = setString;
        this.__tools = tools;
        this.__render2D = render2D;
        this.__render3D = render3D;
        this.__checkDefinitions();
    }

    _createClass(FeatureSet, [{
        key: "containsDefinition",
        value: function containsDefinition(featureTypeString) {
            if (this.__definitions.hasOwnProperty(featureTypeString)) return true;else return false;
        }
    }, {
        key: "getDefaults",
        value: function getDefaults() {
            var output = {};
            var defs = this.__definitions;
            for (var key in defs) {
                output[key] = defs[key]["defaults"];
            }
            return output;
        }
    }, {
        key: "getFeatureType",
        value: function getFeatureType(typeString) {
            var setString = this.name;
            var defaultName = "New " + setString + "." + typeString;
            return function (values) {
                var name = arguments.length <= 1 || arguments[1] === undefined ? defaultName : arguments[1];

                return Feature.makeFeature(typeString, setString, values, name);
            };
        }
    }, {
        key: "getSetString",
        value: function getSetString() {
            return this.setString;
        }
    }, {
        key: "getDefinition",
        value: function getDefinition(typeString) {
            return this.__definitions[typeString];
        }
    }, {
        key: "getRender3D",
        value: function getRender3D(typeString) {
            return this.__render3D[typeString];
        }
    }, {
        key: "getRender2D",
        value: function getRender2D(typeString) {
            return this.__render2D[typeString];
        }
    }, {
        key: "getTool",
        value: function getTool(typeString) {
            return this.__tools[typeString];
        }
    }, {
        key: "makeFeature",
        value: function makeFeature(typeString, setString, values, name) {
            console.log(setString);
            var set = getSet(setString);
            var featureType = getFeatureType(typeString);
            return featureType(values, name);
        }
    }, {
        key: "__checkDefinitions",
        value: function __checkDefinitions() {
            for (var key in this.__definitions) {
                if (!this.__tools.hasOwnProperty(key) || !this.__render2D.hasOwnProperty(key) || !this.__render3D.hasOwnProperty(key)) {
                    throw new Error("Feature set does not contain a renderer or tool definition for: " + key);
                }
            }
        }
    }]);

    return FeatureSet;
})();

module.exports = FeatureSet;

},{"../core/feature":47}],65:[function(require,module,exports){
"use strict";

var FeatureSet = require("./featureSet");
var registeredFeatureSets = {};
var typeStrings = {};
var Registry = require("../core/registry");

// add more sets here!
var requiredSets = {
    "Basic": require("./basic")
};

registerSets(requiredSets);

function makeFeatureSet(set, name) {
    var newSet = new FeatureSet(set.definitions, set.tools, set.render2D, set.render3D, name);
    return newSet;
}

function registerSets(sets) {
    for (var key in sets) {
        var newSet = makeFeatureSet(sets[key], key);
        registeredFeatureSets[key] = newSet;
        Registry.featureDefaults[key] = newSet.getDefaults();
    }
}

function getSet(setString) {
    return registeredFeatureSets[setString];
}

function getDefinition(typeString, setString) {
    var set = getSet(setString);
    var def = set.getDefinition(typeString);
    return def;
}

function getTool(typeString, setString) {
    var set = getSet(setString);
    return set.getTool(typeString);
}

function getRender2D(typeString, setString) {
    var set = getSet(setString);
    return set.getRender2D(typeString);
}

function getRender3D(typeString, setString) {
    var set = getSet(setString);
    return set.getRender3D(typeString);
}

module.exports.getSet = getSet;
module.exports.getDefinition = getDefinition;
module.exports.getTool = getTool;
module.exports.getRender2D = getRender2D;
module.exports.getRender3D = getRender3D;

},{"../core/registry":57,"./basic":60,"./featureSet":64}],66:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SimpleQueue = (function () {
	function SimpleQueue(func, timeout) {
		var report = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

		_classCallCheck(this, SimpleQueue);

		this.timeout = timeout;
		this.func = func;
		this.waiting = false;
		this.queued = true;
		this.counter = 0;
		this.report = report;
	}

	_createClass(SimpleQueue, [{
		key: "run",
		value: function run() {
			if (this.waiting) {
				this.counter++;
				if (!this.queued) {
					this.queued = true;
				}
			} else {
				if (this.report) console.log("Waited " + this.counter + " times.");
				this.func();
				this.startTimer();
				this.counter = 0;
			}
		}
	}, {
		key: "endTimer",
		value: function endTimer() {
			this.waiting = false;
			if (this.queued) {
				this.queued = false;
				this.run();
			}
		}
	}, {
		key: "startTimer",
		value: function startTimer() {
			var ref = this;
			this.waiting = true;
			window.setTimeout(function () {
				ref.endTimer();
			}, this.timeout);
		}
	}]);

	return SimpleQueue;
})();

module.exports = SimpleQueue;

},{}],67:[function(require,module,exports){
'use strict';

var removeClass = function removeClass(el, className) {
  if (el.classList) el.classList.remove(className);else el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
};

var addClass = function addClass(el, className) {
  if (el.classList) el.classList.add(className);else el.className += ' ' + className;
};

// From http://stackoverflow.com/questions/8869403/drag-drop-json-into-chrome
function DnDFileController(selector, onDropCallback) {
  var el_ = document.querySelector(selector);

  this.dragenter = function (e) {
    e.stopPropagation();
    e.preventDefault();
    el_.classList.add('dropping');
  };

  this.dragover = function (e) {
    e.stopPropagation();
    e.preventDefault();
  };

  this.dragleave = function (e) {
    e.stopPropagation();
    e.preventDefault();
    //el_.classList.remove('dropping');
  };

  this.drop = function (e) {
    e.stopPropagation();
    e.preventDefault();

    el_.classList.remove('dropping');

    onDropCallback(e.dataTransfer.files, e);
  };

  el_.addEventListener('dragenter', this.dragenter, false);
  el_.addEventListener('dragover', this.dragover, false);
  el_.addEventListener('dragleave', this.dragleave, false);
  el_.addEventListener('drop', this.drop, false);
};

module.exports.removeClass = removeClass;
module.exports.addClass = addClass;
module.exports.DnDFileController = DnDFileController;

},{}],68:[function(require,module,exports){
"use strict";

function isFloat(n) {
    return n === +n && n !== (n | 0);
}

function isInteger(n) {
    return n === +n && n === (n | 0);
}

function isFloatOrInt(n) {
    return isFloat(n) || isInteger(n);
}

module.exports.isFloat = isFloat;
module.exports.isInteger = isInteger;
module.exports.isFloatOrInt = isFloatOrInt;

},{}],69:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SimpleQueue = (function () {
	function SimpleQueue(func, timeout) {
		var report = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

		_classCallCheck(this, SimpleQueue);

		this.timeout = timeout;
		this.func = func;
		this.waiting = false;
		this.queued = true;
		this.counter = 0;
		this.report = report;
	}

	_createClass(SimpleQueue, [{
		key: "run",
		value: function run() {
			if (this.waiting) {
				this.counter++;
				if (!this.queued) {
					this.queued = true;
				}
			} else {
				if (this.report) console.log("Waited " + this.counter + " times.");
				this.func();
				this.startTimer();
				this.counter = 0;
			}
		}
	}, {
		key: "endTimer",
		value: function endTimer() {
			this.waiting = false;
			if (this.queued) {
				this.queued = false;
				this.run();
			}
		}
	}, {
		key: "startTimer",
		value: function startTimer() {
			var ref = this;
			this.waiting = true;
			window.setTimeout(function () {
				ref.endTimer();
			}, this.timeout);
		}
	}]);

	return SimpleQueue;
})();

module.exports = SimpleQueue;

},{}],70:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Registry = require("../core/registry");

var PanAndZoom = (function () {
    function PanAndZoom(paperView) {
        _classCallCheck(this, PanAndZoom);

        this.view = paperView;
    }

    _createClass(PanAndZoom, [{
        key: "stableZoom",
        value: function stableZoom(zoom, position) {
            var newZoom = zoom;
            var p = position;
            var c = this.view.getCenter();
            var beta = this.view.getZoom() / newZoom;
            var pc = p.subtract(c);
            var a = p.subtract(pc.multiply(beta)).subtract(c);
            this.view.setCenter(this.view.getCenter().add(a));
            this.view.setZoom(newZoom);
        }
    }, {
        key: "adjustZoom",
        value: function adjustZoom(delta, position) {
            this.stableZoom(this.calcZoom(delta), position);
        }

        // Stable pan and zoom modified from: http://matthiasberth.com/articles/stable-zoom-and-pan-in-paperjs/

    }, {
        key: "calcZoom",
        value: function calcZoom(delta) {
            var multiplier = arguments.length <= 1 || arguments[1] === undefined ? 1.177827941003 : arguments[1];

            if (delta < 0) return this.view.getZoom() * multiplier;else if (delta > 0) return this.view.getZoom() / multiplier;else return this.view.getZoom();
        }
    }, {
        key: "moveCenter",
        value: function moveCenter(delta) {
            this.view.setCenter(this.calcCenter(delta));
        }
    }, {
        key: "calcCenter",
        value: function calcCenter(delta) {
            return this.view.getCenter().subtract(delta);
        }
    }]);

    return PanAndZoom;
})();

module.exports = PanAndZoom;

},{"../core/registry":57}],71:[function(require,module,exports){
"use strict";

var HTMLUtils = require("../../utils/htmlUtils");
var Feature = require("../../core/feature");
var Registry = require("../../core/registry");
var Parameters = require("../../core/parameters");
var FeatureSets = require("../../featureSets");

var FloatValue = Parameters.FloatValue;
var BooleanValue = Parameters.BooleanValue;

var createSlider = function createSlider(min, max, step, start, id) {
  var div = document.createElement("div");
  var p = document.createElement("p");
  p.setAttribute("style", "min-width: 240px");
  var slider = document.createElement("input");
  slider.className = "mdl-slider mdl-js-slider";
  slider.setAttribute("type", "range");
  slider.setAttribute("id", id);
  slider.setAttribute("min", min);
  slider.setAttribute("max", max);
  slider.setAttribute("value", start);
  slider.setAttribute("step", step);
  p.appendChild(slider);
  componentHandler.upgradeElement(slider, "MaterialSlider");
  div.appendChild(p);
  return div;
};

var createButton = function createButton(iconString) {
  var button = document.createElement("button");
  button.className = "mdl-button mdl-js-button mdl-button--icon";
  var icon = document.createElement("i");
  icon.className = "material-icons";
  icon.innerHTML = iconString;
  button.appendChild(icon);
  componentHandler.upgradeElement(button, "MaterialButton");
  return button;
};

var createValueField = function createValueField(start, id) {
  var div = document.createElement("div");
  var error = document.createElement("span");
  var span = document.createElement("span");
  span.innerHTML = "μm";
  span.style.fontSize = "14px";
  error.className = "mdl-textfield__error";
  error.innerHTML = "Digits only";
  div.className = "mdl-textfield mdl-js-textfield";
  var field = document.createElement("input");
  field.className = "mdl-textfield__input";
  field.setAttribute("type", "text");
  field.setAttribute("id", id);
  field.setAttribute("value", start);
  field.setAttribute("pattern", "[0-9]*");
  field.style.paddingTop = "0px";
  div.appendChild(field);
  div.appendChild(span);
  div.appendChild(error);
  div.setAttribute("style", "margin-left: auto; margin-right: auto; display: block;width:65px;padding-top:0px;padding-bottom:5px;");
  componentHandler.upgradeElement(div, "MaterialTextfield");
  return div;
};

var createTableElement = function createTableElement(child) {
  var td = document.createElement("td");
  td.appendChild(child);
  return td;
};

var createCheckbox = function createCheckbox(checked, id) {
  var div = document.createElement("div");
  var label = document.createElement("label");
  label.className = "mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect";
  label.setAttribute("for", id);
  var input = document.createElement("input");
  input.setAttribute("type", "checkbox");
  input.setAttribute("id", id);
  if (checked) input.checked = true;
  input.className = "mdl-checkbox__input";
  label.appendChild(input);
  componentHandler.upgradeElement(label, "MaterialCheckbox");
  div.setAttribute("style", "margin-left: auto; margin-right: auto; display: block;width:12px;position:relative;");
  div.appendChild(label);
  return div;
};

var createSpan = function createSpan(value, id) {
  var div = document.createElement("div");
  var span = document.createElement("span");
  span.innerHTML = value;
  span.setAttribute("id", id);
  span.setAttribute("style", "font-size: 16px;");
  div.setAttribute("style", "margin-left: none; margin-right: auto; display: block;width:24px;");
  div.appendChild(span);
  return div;
};

var createTableRow = function createTableRow(one, two, three) {
  var tr = document.createElement("tr");
  one.style.borderBottom = "none";
  tr.appendChild(one);
  tr.appendChild(two);
  tr.appendChild(three);
  return tr;
};

var generateUpdateFunction = function generateUpdateFunction(sourceID, targetID, typeString, setString, paramString) {
  return function () {
    var source = document.getElementById(sourceID);
    var target = document.getElementById(targetID);
    var param;
    try {
      param = new FloatValue(parseFloat(source.value));
    } catch (err) {
      console.log("Invalid Float value.");
      return;
    }
    target.value = String(param.getValue());
    Registry.viewManager.adjustParams(typeString, setString, paramString, param.getValue());
  };
};

var generateCheckFunction = function generateCheckFunction(sourceID, targetID, typeString, setString, paramString) {
  return function () {
    var source = document.getElementById(sourceID);
    var target = document.getElementById(targetID);
    var param;
    try {
      param = new BooleanValue(source.checked);
    } catch (err) {
      console.log("Invalid Boolean value.");
      return;
    }
    if (param.getValue()) target.innerHTML = "true";else target.innerHTML = "false";
    Registry.viewManager.adjustParams(typeString, setString, paramString, param.getValue());
  };
};

var createSliderRow = function createSliderRow(featureID, typeString, setString, key) {
  var definition = FeatureSets.getDefinition(typeString, setString);
  var min = definition.minimum[key];
  var max = definition.maximum[key];
  var value = Feature.getDefaultsForType(typeString, setString)[key];
  var step = 10;
  var titleID = featureID + "_" + key + "_title";
  var sliderID = featureID + "_" + key + "_slider";
  var fieldID = featureID + "_" + key + "_value";
  var title = createSpan(key, titleID);
  var titleContainer = createTableElement(title);
  titleContainer.style.borderBottom = "none";
  var slider = createSlider(min, max, step, value, sliderID);
  var sliderContainer = createTableElement(slider);
  sliderContainer.setAttribute("style", "padding-left: 0px; padding-right: 0px");
  var field = createValueField(value, fieldID);
  var fieldContainer = createTableElement(field);
  var row = createTableRow(sliderContainer, titleContainer, fieldContainer);
  field.oninput = generateUpdateFunction(fieldID, sliderID, typeString, setString, key);
  slider.oninput = generateUpdateFunction(sliderID, fieldID, typeString, setString, key);
  return row;
};

var createCheckboxRow = function createCheckboxRow(featureID, typeString, setString, key) {
  var title = createSpan(key);
  var checkID = featureID + "_" + key + "_checkbox";
  var spanID = featureID + "_" + key + "_span";
  var value = Feature.getDefaultsForType(typeString, setString)[key];
  var checkBox = createCheckbox(value, checkID);
  var spanValue;
  if (value) spanValue = "true";else spanValue = "false";
  var span = createSpan(spanValue, spanID);
  var titleContainer = createTableElement(title);
  var checkContainer = createTableElement(checkBox);
  var spanContainer = createTableElement(span);
  var row = createTableRow(checkContainer, titleContainer, spanContainer);
  checkBox.onchange = generateCheckFunction(checkID, spanID, typeString, setString, key);
  return row;
};

var createFeatureTableRows = function createFeatureTableRows(typeString, setString) {
  var def = FeatureSets.getDefinition(typeString, setString);
  var heritable = def.heritable;
  var id = "fake_ID";
  var rows = [];
  for (var key in heritable) {
    var row;
    var type = heritable[key];
    if (type == "Float" || type == "Integer") row = createSliderRow(id, typeString, setString, key);else if (type == "Boolean") row = createCheckboxRow(id, typeString, setString, key);
    rows.push(row);
  }
  return rows;
};

var createFeatureTableHeaders = function createFeatureTableHeaders(typeString) {
  var thead = document.createElement("thead");
  var tr = document.createElement("tr");
  thead.appendChild(tr);
  var param = document.createElement("th");
  param.className = "mdl-data-table__cell--non-numeric";
  param.innerHTML = "Parameter";
  var value = document.createElement("th");
  value.className = "mdl-data-table__cell--non-numeric";
  value.innerHTML = "Value";
  var type = document.createElement("th");
  type.className = "mdl-data-table__cell--non-numeric";
  type.innerHTML = typeString + " Parameters";
  type.style.fontSize = "18px";
  type.style.color = "#000000";
  //type.style.right = "35px";
  tr.appendChild(type);
  tr.appendChild(param);
  tr.appendChild(value);
  return thead;
};

var createFeatureTableBody = function createFeatureTableBody(typeString, setString) {
  var body = document.createElement("tbody");
  body.setAttribute("id", "featureTable");
  var rows = createFeatureTableRows(typeString, setString);
  for (var i = 0; i < rows.length; i++) {
    body.appendChild(rows[i]);
  }
  return body;
};

var createFeatureTable = function createFeatureTable(typeString, setString, position) {
  var table = document.createElement("table");
  table.className = "mdl-data-table mdl-js-data-table mdl-shadow--2dp feature-table fade-transition";
  var head = createFeatureTableHeaders(typeString);
  table.appendChild(head);
  var body = createFeatureTableBody(typeString, setString);
  table.appendChild(body);
  var closeButton = createCloseButton();
  closeButton.style.position = "absolute";
  closeButton.style.right = "0px";
  closeButton.style.top = "0px";
  //table.appendChild(closeButton);
  closeButton.onclick = function () {
    table.parentElement.removeChild(table);
  };
  HTMLUtils.addClass(table, "hidden-block");
  table.style.zIndex = 999999;
  return table;
};

var createCloseButton = function createCloseButton() {
  var button = createButton("close");
  button.style.color = "#313131";
  return button;
};

var generateTableFunction = function generateTableFunction(tableID, typeString, setString) {
  return function (event) {
    var table = document.getElementById(tableID);
    if (table) {
      table.parentElement.removeChild(table);
    } else {
      table = createFeatureTable(typeString, setString);
      table.id = tableID;
      table.style.position = "absolute";
      table.style.left = "" + (event.clientX + 30) + "px";
      table.style.top = "" + (event.clientY - 20) + "px";
      HTMLUtils.removeClass(table, "hidden-block");
      HTMLUtils.addClass(table, "shown-block");
      document.body.appendChild(table);
    }
  };
};

module.exports.generateTableFunction = generateTableFunction;

},{"../../core/feature":47,"../../core/parameters":52,"../../core/registry":57,"../../featureSets":65,"../../utils/htmlUtils":67}],72:[function(require,module,exports){
"use strict";

var Feature = require("../core/feature");
//Colors taken from: http://www.google.ch/design/spec/style/color.html
module.exports.RED_500 = "#F44336";
module.exports.INDIGO_500 = "#3F51B5";
module.exports.GREEN_500 = "#4CAF50";
module.exports.GREEN_100 = "#C8E6C9";
module.exports.GREEN_A200 = "#69F0AE";
module.exports.DEEP_PURPLE_500 = "#673AB7";
module.exports.PURPLE_200 = "#E1BEE7";
module.exports.PURPLE_100 = "#E1BEE7";
module.exports.TEAL_100 = "#B2DFDB";
module.exports.BLUE_50 = "#e3f2fd";
module.exports.BLUE_100 = "#BBDEFB";
module.exports.BLUE_200 = "#90CAF9";
module.exports.BLUE_300 = "#64B5F6";
module.exports.BLUE_500 = "#2196F3";
module.exports.GREY_200 = "#EEEEEE";
module.exports.GREY_300 = "#E0E0E0";
module.exports.GREY_400 = "#BDBDBD";
module.exports.LIGHT_GREEN_100 = "#DCEDC8";
module.exports.GREY_700 = "#616161";
module.exports.GREY_500 = "#9E9E9E";
module.exports.AMBER_50 = "#FFF8E1";
module.exports.PINK_500 = "#E91E63";
module.exports.PINK_300 = "#F06292";
module.exports.BLACK = "#000000";
module.exports.WHITE = "#FFFFFF";

var defaultColorKeys = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];
var darkColorKeys = ["300", "400", "500", "600", "700", "800", "900"];

var indigo = {
	"900": "#" + "1A237E",
	"800": "#" + "283593",
	"700": "#" + "303F9F",
	"600": "#" + "3949AB",
	"500": "#" + "3F51B5",
	"400": "#" + "5C6BC0",
	"300": "#" + "7986CB",
	"200": "#" + "9FA8DA",
	"100": "#" + "C5CAE9",
	"50": "#" + "E8EAF6",
	"A100": "#" + "8C9EFF",
	"A200": "#" + "536DFE",
	"A400": "#" + "3D5AFE",
	"A700": "#" + "304FFE"
};

var red = {
	"900": "#" + "B71C1C",
	"800": "#" + "C62828",
	"700": "#" + "D32F2F",
	"600": "#" + "E53935",
	"500": "#" + "F44336",
	"400": "#" + "EF5350",
	"300": "#" + "E57373",
	"200": "#" + "EF9A9A",
	"100": "#" + "FFCDD2",
	"50": "#" + "FFEBEE",
	"A100": "#" + "FF8A80",
	"A200": "#" + "FF5252",
	"A400": "#" + "FF1744",
	"A700": "#" + "D50000"
};

var layerColors = {
	"indigo": indigo,
	"red": red
};

var decimalToIndex = function decimalToIndex(decimal, indices) {
	return Math.round((indices - 1) * decimal);
};

var decimalToLayerColor = function decimalToLayerColor(decimal, layerColors, orderedKeys) {
	var index = decimalToIndex(decimal, orderedKeys.length);
	var key = orderedKeys[index];
	return layerColors[key];
};

var renderAllColors = function renderAllColors(layer, orderedKeys) {
	for (var i = 0; i < orderedKeys.length; i++) {

		new paper.Path.Circle({
			position: new paper.Point(0 + i * 1000, 0),
			fillColor: layer[orderedKeys[i]],
			radius: 500
		});
	}

	for (var i = 0; i < orderedKeys.length; i++) {
		var color = decimalToLayerColor(i / orderedKeys.length, layer, orderedKeys);
		new paper.Path.Circle({
			position: new paper.Point(0 + i * 1000, 2000),
			fillColor: layer[orderedKeys[i]],
			radius: 500
		});
	}
};

var getLayerColors = function getLayerColors(layer) {
	if (layer && layer.color) return layerColors[layer.color];else return layerColors["red"];
};

var getDefaultLayerColor = function getDefaultLayerColor(layer) {
	return getLayerColors(layer)["500"];
};

var getDefaultFeatureColor = function getDefaultFeatureColor(typeString, setString, layer) {
	if (layer) {
		var height = Feature.getDefaultsForType(typeString, setString)["height"];
		var decimal = height / layer.estimateLayerHeight();
		if (!layer.flip) decimal = 1 - decimal;
		var colors = getLayerColors(layer);
		return decimalToLayerColor(decimal, colors, darkColorKeys);
	} else {
		return decimalToLayerColor(0, layerColors["indigo"], darkColorKeys);
	}
};

module.exports.getDefaultLayerColor = getDefaultLayerColor;
module.exports.getDefaultFeatureColor = getDefaultFeatureColor;
module.exports.getLayerColors = getLayerColors;
module.exports.decimalToLayerColor = decimalToLayerColor;
module.exports.defaultColorKeys = defaultColorKeys;
module.exports.darkColorKeys = darkColorKeys;
module.exports.layerColors = layerColors;
module.exports.renderAllColors = renderAllColors;

},{"../core/feature":47}],73:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Registry = require("../../core/registry");
var Colors = require("../colors");

var AdaptiveGrid = (function () {
    function AdaptiveGrid() {
        var minSpacing = arguments.length <= 0 || arguments[0] === undefined ? 10 : arguments[0];
        var maxSpacing = arguments.length <= 1 || arguments[1] === undefined ? 100 : arguments[1];
        var thickCount = arguments.length <= 2 || arguments[2] === undefined ? 10 : arguments[2];
        var origin = arguments.length <= 3 || arguments[3] === undefined ? [0, 0] : arguments[3];
        var thinWidth = arguments.length <= 4 || arguments[4] === undefined ? 1 : arguments[4];
        var thickWidth = arguments.length <= 5 || arguments[5] === undefined ? 3 : arguments[5];
        var color = arguments.length <= 6 || arguments[6] === undefined ? Colors.BLUE_100 : arguments[6];

        _classCallCheck(this, AdaptiveGrid);

        this.origin = new paper.Point(origin[0], origin[1]);
        this.thinWidth = thinWidth; //pixel
        this.thickWidth = thickWidth; // pixels
        this.minSpacing = minSpacing; //pixels
        this.maxSpacing = maxSpacing; //pixels
        this.thickCount = thickCount;
        this.spacing = 1000;
        this.color = color;

        if (Registry.currentGrid) throw new Error("Cannot instantiate more than one AdaptiveGrid!");
        Registry.currentGrid = this;
    }

    _createClass(AdaptiveGrid, [{
        key: "getClosestGridPoint",
        value: function getClosestGridPoint(point) {
            var x = Math.round((point.x - this.origin.x) / this.spacing) * this.spacing + this.origin.x;
            var y = Math.round((point.y - this.origin.y) / this.spacing) * this.spacing + this.origin.y;
            return new paper.Point(x, y);
        }
    }, {
        key: "setOrigin",
        value: function setOrigin(origin) {
            this.origin = new paper.Point(origin[0], origin[1]);
            this.updateView();
        }
    }, {
        key: "setThinWidth",
        value: function setThinWidth(width) {
            this.thinWidth = width;
            this.updateView();
        }
    }, {
        key: "setThickWidth",
        value: function setThickWidth(width) {
            this.thickWidth = width;
            this.updateView();
        }
    }, {
        key: "setMinSpacing",
        value: function setMinSpacing(pixels) {
            this.spacing = pixels;
            this.updateView();
        }
    }, {
        key: "setMaxSpacing",
        value: function setMaxSpacing(pixels) {
            this.maxSpacing = pixels;
            this.updateView();
        }
    }, {
        key: "setColor",
        value: function setColor(color) {
            this.color = color;
            this.updateView();
        }
    }, {
        key: "getSpacing",
        value: function getSpacing() {
            var min = this.minSpacing / paper.view.zoom;
            var max = this.maxSpacing / paper.view.zoom;
            while (this.spacing < min) {
                this.spacing = this.spacing * 10;
            }
            while (this.spacing > max) {
                this.spacing = this.spacing / 10;
            }
            return this.spacing;
        }
    }, {
        key: "getThinWidth",
        value: function getThinWidth() {
            return this.thinWidth / paper.view.zoom;
        }
    }, {
        key: "getThickWidth",
        value: function getThickWidth() {
            return this.thickWidth / paper.view.zoom;
        }
    }, {
        key: "updateView",
        value: function updateView() {
            if (Registry.viewManager) Registry.viewManager.updateGrid();
        }
    }]);

    return AdaptiveGrid;
})();

module.exports = AdaptiveGrid;

},{"../../core/registry":57,"../colors":72}],74:[function(require,module,exports){
"use strict";

var HTMLUtils = require("../utils/htmlUtils");
var Registry = require("../core/registry");
var Colors = require("./colors");
var JSZip = require("jszip");
var ParameterMenu = require("./UI/parameterMenu");

var activeButton = null;
var activeLayer = null;
var channelButton = document.getElementById("channel_button");
var circleValveButton = document.getElementById("circleValve_button");
var portButton = document.getElementById("port_button");
var viaButton = document.getElementById("via_button");
var chamberButton = document.getElementById("chamber_button");

var channelParams = document.getElementById("channel_params_button");
var circleValveParams = document.getElementById("circleValve_params_button");
var portParams = document.getElementById("port_params_button");
var viaParams = document.getElementById("via_params_button");
var chamberParams = document.getElementById("chamber_params_button");

var jsonButton = document.getElementById("json_button");
var svgButton = document.getElementById("svg_button");
var stlButton = document.getElementById("stl_button");

var button2D = document.getElementById("button_2D");
var button3D = document.getElementById("button_3D");

var flowButton = document.getElementById("flow_button");
var controlButton = document.getElementById("control_button");

var inactiveBackground = Colors.GREY_200;
var inactiveText = Colors.BLACK;
var activeText = Colors.WHITE;

var canvas = document.getElementById("c");

var canvasBlock = document.getElementById("canvas_block");
var renderBlock = document.getElementById("renderContainer");

var renderer = undefined;
var view = undefined;

var threeD = false;

var buttons = {
    "Channel": channelButton,
    "Via": viaButton,
    "Port": portButton,
    "CircleValve": circleValveButton,
    "Chamber": chamberButton
};

var layerButtons = {
    "0": flowButton,
    "1": controlButton
};

var layerIndices = {
    "0": 0,
    "1": 1
};

var zipper = new JSZip();

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    ev.target.appendChild(document.getElementById(data));
}

function setButtonColor(button, background, text) {
    button.style.background = background;
    button.style.color = text;
}

function setActiveButton(feature) {
    killParamsWindow();
    if (activeButton) setButtonColor(buttons[activeButton], inactiveBackground, inactiveText);
    activeButton = feature;
    var color = Colors.getDefaultFeatureColor(activeButton, "Basic", Registry.currentLayer);
    setButtonColor(buttons[activeButton], color, activeText);
}

function setActiveLayer(layerName) {
    if (activeLayer) setButtonColor(layerButtons[activeLayer], inactiveBackground, inactiveText);
    activeLayer = layerName;
    setActiveButton(activeButton);
    var bgColor = Colors.getDefaultLayerColor(Registry.currentLayer);
    setButtonColor(layerButtons[activeLayer], bgColor, activeText);
    if (threeD) {
        setButtonColor(button3D, Colors.getDefaultLayerColor(Registry.currentLayer), activeText);
        setButtonColor(button2D, inactiveBackground, inactiveText);
    } else {
        setButtonColor(button2D, Colors.getDefaultLayerColor(Registry.currentLayer), activeText);
        setButtonColor(button3D, inactiveBackground, inactiveText);
    }
}

function switchTo3D() {
    if (!threeD) {
        threeD = true;
        setButtonColor(button3D, Colors.getDefaultLayerColor(Registry.currentLayer), activeText);
        setButtonColor(button2D, inactiveBackground, inactiveText);
        renderer.loadJSON(Registry.currentDevice.toJSON());
        var cameraCenter = view.getViewCenterInMillimeters();
        var height = Registry.currentDevice.params.getValue("height") / 1000;
        var pixels = view.getDeviceHeightInPixels();
        renderer.setupCamera(cameraCenter[0], cameraCenter[1], height, pixels, paper.view.zoom);
        renderer.showMockup();
        HTMLUtils.removeClass(renderBlock, "hidden-block");
        HTMLUtils.addClass(canvasBlock, "hidden-block");
        HTMLUtils.addClass(renderBlock, "shown-block");
        HTMLUtils.removeClass(canvasBlock, "shown-block");
    }
}

//TODO: transition backwards is super hacky. Fix it!
function switchTo2D() {
    if (threeD) {
        threeD = false;
        var center = renderer.getCameraCenterInMicrometers();
        var zoom = renderer.getZoom();
        var newCenterX = center[0];
        if (newCenterX < 0) {
            newCenterX = 0;
        } else if (newCenterX > Registry.currentDevice.params.getValue("width")) {
            newCenterX = Registry.currentDevice.params.getValue("width");
        }
        var newCenterY = paper.view.center.y - center[1];
        if (newCenterY < 0) {
            newCenterY = 0;
        } else if (newCenterY > Registry.currentDevice.params.getValue("height")) {
            newCenterY = Registry.currentDevice.params.getValue("height");
        }
        setButtonColor(button2D, Colors.getDefaultLayerColor(Registry.currentLayer), activeText);
        setButtonColor(button3D, inactiveBackground, inactiveText);
        Registry.viewManager.setCenter(new paper.Point(newCenterX, newCenterY));
        Registry.viewManager.setZoom(zoom);
        HTMLUtils.addClass(renderBlock, "hidden-block");
        HTMLUtils.removeClass(canvasBlock, "hidden-block");
        HTMLUtils.removeClass(renderBlock, "shown-block");
        HTMLUtils.addClass(canvasBlock, "shown-block");
    }
}

function paramsWindowFunction(typeString, setString) {
    var makeTable = ParameterMenu.generateTableFunction("parameter_menu", typeString, setString);
    return function (event) {
        killParamsWindow();
        makeTable(event);
    };
}

function killParamsWindow() {
    var paramsWindow = document.getElementById("parameter_menu");
    if (paramsWindow) paramsWindow.parentElement.removeChild(paramsWindow);
}

function setupAppPage() {

    view = Registry.viewManager.view;
    renderer = Registry.threeRenderer;
    channelButton.onclick = function () {
        Registry.viewManager.activateTool("Channel");
        var bg = Colors.getDefaultFeatureColor("Channel", "Basic", Registry.currentLayer);
        setActiveButton("Channel");
        switchTo2D();
    };

    circleValveButton.onclick = function () {
        Registry.viewManager.activateTool("CircleValve");
        var bg = Colors.getDefaultFeatureColor("CircleValve", "Basic", Registry.currentLayer);
        setActiveButton("CircleValve");
        switchTo2D();
    };

    portButton.onclick = function () {
        Registry.viewManager.activateTool("Port");
        var bg = Colors.getDefaultFeatureColor("Port", "Basic", Registry.currentLayer);
        setActiveButton("Port");
        switchTo2D();
    };

    viaButton.onclick = function () {
        Registry.viewManager.activateTool("Via");
        var bg = Colors.getDefaultFeatureColor("Via", "Basic", Registry.currentLayer);
        setActiveButton("Via");
        switchTo2D();
    };

    chamberButton.onclick = function () {
        Registry.viewManager.activateTool("Chamber");
        var bg = Colors.getDefaultFeatureColor("Chamber", "Basic", Registry.currentLayer);
        setActiveButton("Chamber");
        switchTo2D();
    };

    flowButton.onclick = function () {
        if (threeD) {
            if (activeLayer == "0") renderer.toggleLayerView(0);else renderer.showLayer(0);
        }
        Registry.currentLayer = Registry.currentDevice.layers[0];
        setActiveLayer("0");
        Registry.viewManager.updateActiveLayer();
    };

    controlButton.onclick = function () {
        if (threeD) {
            if (activeLayer == "1") renderer.toggleLayerView(1);else renderer.showLayer(1);
        }
        Registry.currentLayer = Registry.currentDevice.layers[1];
        setActiveLayer("1");
        Registry.viewManager.updateActiveLayer();
    };

    jsonButton.onclick = function () {
        var json = new Blob([JSON.stringify(Registry.currentDevice.toJSON())], {
            type: "application/json"
        });
        saveAs(json, "device.json");
    };

    stlButton.onclick = function () {
        var json = Registry.currentDevice.toJSON();
        var stls = renderer.getSTL(json);
        var blobs = [];
        var zipper = new JSZip();
        for (var i = 0; i < stls.length; i++) {
            var _name = "" + i + "_" + json.name + "_" + json.layers[i].name + ".stl";
            zipper.file(_name, stls[i]);
        }
        var content = zipper.generate({
            type: "blob"
        });
        saveAs(content, json.name + "_layers.zip");
    };

    svgButton.onclick = function () {
        var svgs = Registry.viewManager.layersToSVGStrings();
        //let svg = paper.project.exportSVG({asString: true});
        var blobs = [];
        var success = 0;
        var zipper = new JSZip();
        for (var i = 0; i < svgs.length; i++) {
            if (svgs[i].slice(0, 4) == "<svg") {
                zipper.file("Device_layer_" + i + ".svg", svgs[i]);
                success++;
            }
        }

        if (success == 0) throw new Error("Unable to generate any valid SVGs. Do all layers have at least one non-channel item in them?");else {
            var content = zipper.generate({
                type: "blob"
            });
            saveAs(content, "device_layers.zip");
        }
    };

    button2D.onclick = function () {
        killParamsWindow();
        switchTo2D();
    };

    button3D.onclick = function () {
        killParamsWindow();
        switchTo3D();
    };

    channelParams.onclick = paramsWindowFunction("Channel", "Basic");
    circleValveParams.onclick = paramsWindowFunction("CircleValve", "Basic");
    portParams.onclick = paramsWindowFunction("Port", "Basic");
    viaParams.onclick = paramsWindowFunction("Via", "Basic");
    chamberParams.onclick = paramsWindowFunction("Chamber", "Basic");

    function setupDragAndDropLoad(selector) {
        var dnd = new HTMLUtils.DnDFileController(selector, function (files) {
            var f = files[0];

            var reader = new FileReader();
            reader.onloadend = function (e) {
                var result = JSON.parse(this.result);
                Registry.viewManager.loadDeviceFromJSON(result);
                switchTo2D();
            };
            try {
                reader.readAsText(f);
            } catch (err) {
                console.log("unable to load JSON: " + f);
            }
        });
    }

    setupDragAndDropLoad("#c");
    setupDragAndDropLoad("#renderContainer");
    setActiveButton("Channel");
    setActiveLayer("0");
    switchTo2D();
}

module.exports.setupAppPage = setupAppPage;
module.exports.paramsWindowFunction = paramsWindowFunction;
module.exports.killParamsWindow = killParamsWindow;

},{"../core/registry":57,"../utils/htmlUtils":67,"./UI/parameterMenu":71,"./colors":72,"jszip":13}],75:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Registry = require("../core/registry");
var FeatureRenderer2D = require("./render2D/featureRenderer2D");
var GridRenderer = require("./render2D/GridRenderer");
var DeviceRenderer = require("./render2D/deviceRenderer2D");
var PanAndZoom = require("./PanAndZoom");
var SimpleQueue = require("../utils/simpleQueue");
var Colors = require("./colors");

var PaperView = (function () {
    function PaperView(canvas) {
        _classCallCheck(this, PaperView);

        this.panAndZoom = new PanAndZoom(this);
        this.center = paper.view.center;
        this.zoom = paper.view.zoom;
        this.canvas = canvas;
        this.paperFeatures = {};
        this.paperLayers = [];
        this.paperGrid = null;
        this.paperDevice = null;
        this.activeLayer = null;
        this.gridLayer = new paper.Group();
        this.deviceLayer = new paper.Group();
        this.gridLayer.insertAbove(this.deviceLayer);
        this.featureLayer = new paper.Group();
        this.featureLayer.insertAbove(this.gridLayer);
        this.uiLayer = new paper.Group();
        this.uiLayer.insertAbove(this.featureLayer);
        this.currentTarget = null;
        this.lastTargetType = null;
        this.lastTargetPosition = null;
        this.inactiveAlpha = .5;
        this.disableContextMenu();
    }

    _createClass(PaperView, [{
        key: "getSelectedFeatures",
        value: function getSelectedFeatures() {
            var output = [];
            var items = paper.project.selectedItems;
            for (var i = 0; i < items.length; i++) {
                output.push(Registry.currentDevice.getFeatureByID(items[i].featureID));
            }
            return output;
        }
    }, {
        key: "deleteSelectedFeatures",
        value: function deleteSelectedFeatures() {
            var items = paper.project.selectedItems;
            if (items && items.length > 0) {
                for (var i = 0; i < items.length; i++) {
                    Registry.currentDevice.removeFeatureByID(items[i].featureID);
                }
            }
        }
    }, {
        key: "layersToSVGStrings",
        value: function layersToSVGStrings() {
            var output = [];
            for (var i = 0; i < this.featureLayer.children.length; i++) {
                var layer = this.featureLayer.children[i];
                var svg = this.postProcessLayerToSVG(layer);
                output.push(svg);
            }
            return output;
        }
    }, {
        key: "postProcessLayerToSVG",
        value: function postProcessLayerToSVG(layer) {
            var layerCopy = layer.clone();
            layerCopy.bounds.topLeft = new paper.Point(0, 0);
            var deviceWidth = Registry.currentDevice.params.getValue("width");
            var deviceHeight = Registry.currentDevice.params.getValue("height");
            layerCopy.bounds.bottomRight = new paper.Point(deviceWidth, deviceHeight);
            var svg = layer.exportSVG({
                asString: true
            });
            var width = layerCopy.bounds.width;
            var height = layerCopy.bounds.height;
            var widthInMillimeters = width / 1000;
            var heightInMilliMeters = height / 1000;
            var insertString = 'width="' + widthInMillimeters + 'mm" ' + 'height="' + heightInMilliMeters + 'mm" ' + 'viewBox="0 0 ' + width + ' ' + height + '" ';
            var newSVG = svg.slice(0, 5) + insertString + svg.slice(5);
            layerCopy.remove();
            return newSVG;
        }
    }, {
        key: "getCanvasWidth",
        value: function getCanvasWidth() {
            return this.canvas.clientWidth;
        }
    }, {
        key: "getCanvasHeight",
        value: function getCanvasHeight() {
            return this.canvas.clientHeight;
        }
    }, {
        key: "getViewCenterInMillimeters",
        value: function getViewCenterInMillimeters() {
            return [paper.view.center.x / 1000, paper.view.center.y / 1000];
        }
    }, {
        key: "getDeviceHeightInPixels",
        value: function getDeviceHeightInPixels() {
            return Registry.currentDevice.params.getValue("height") * paper.view.zoom;
        }
    }, {
        key: "clear",
        value: function clear() {
            this.activeLayer = null;
            this.featureLayer.removeChildren();
            this.featureLayer.clear();
            this.deviceLayer.clear();
            this.gridLayer.clear();
        }
    }, {
        key: "getCenter",
        value: function getCenter() {
            return this.center;
        }
    }, {
        key: "setCenter",
        value: function setCenter(point) {
            this.center = point;
            this.updateCenter();
        }
    }, {
        key: "updateCenter",
        value: function updateCenter() {
            paper.view.center = this.center;
        }
    }, {
        key: "getZoom",
        value: function getZoom() {
            return this.zoom;
        }
    }, {
        key: "setZoom",
        value: function setZoom(zoom) {
            this.zoom = zoom;
            this.updateZoom();
        }
    }, {
        key: "updateZoom",
        value: function updateZoom() {
            paper.view.zoom = this.zoom;
        }
    }, {
        key: "canvasToProject",
        value: function canvasToProject(x, y) {
            var rect = this.canvas.getBoundingClientRect();
            var projX = x - rect.left;
            var projY = y - rect.top;
            return paper.view.viewToProject(new paper.Point(projX, projY));
        }
    }, {
        key: "getProjectPosition",
        value: function getProjectPosition(x, y) {
            return this.canvasToProject(x, y);
        }
    }, {
        key: "setMouseWheelFunction",
        value: function setMouseWheelFunction(func) {
            this.canvas.addEventListener("wheel", func);
        }
    }, {
        key: "setMouseDownFunction",
        value: function setMouseDownFunction(func) {
            this.canvas.onmousedown = func;
        }
    }, {
        key: "setMouseUpFunction",
        value: function setMouseUpFunction(func) {
            this.canvas.onmouseup = func;
        }
    }, {
        key: "setMouseMoveFunction",
        value: function setMouseMoveFunction(func) {
            this.canvas.onmousemove = func;
        }
    }, {
        key: "setKeyPressFunction",
        value: function setKeyPressFunction(func) {
            this.canvas.onkeypress = func;
        }
    }, {
        key: "setKeyDownFunction",
        value: function setKeyDownFunction(func) {
            this.canvas.onkeydown = func;
        }
    }, {
        key: "setResizeFunction",
        value: function setResizeFunction(func) {
            paper.view.onResize = func;
        }
    }, {
        key: "disableContextMenu",
        value: function disableContextMenu(func) {
            this.canvas.oncontextmenu = function (event) {
                event.preventDefault();
            };
        }
    }, {
        key: "refresh",
        value: function refresh() {
            paper.view.update();
        }

        /* Rendering Devices */
    }, {
        key: "addDevice",
        value: function addDevice(device) {
            this.updateDevice(device);
        }
    }, {
        key: "updateDevice",
        value: function updateDevice(device) {
            this.removeDevice(device);
            var newPaperDevice = DeviceRenderer.renderDevice(device);
            this.paperDevice = newPaperDevice;
            this.deviceLayer.addChild(newPaperDevice);
        }
    }, {
        key: "removeDevice",
        value: function removeDevice() {
            if (this.paperDevice) this.paperDevice.remove();
            this.paperDevice = null;
        }

        /* Rendering Layers */

    }, {
        key: "addLayer",
        value: function addLayer(layer, index) {
            this.paperLayers[index] = new paper.Group();
            this.featureLayer.addChild(this.paperLayers[index]);
            // this.setActiveLayer(index);
        }
    }, {
        key: "updateLayer",
        value: function updateLayer(layer, index) {
            // do nothing, for now
        }
    }, {
        key: "removeLayer",
        value: function removeLayer(layer, index) {}
        // do nothing, for now

        /* Rendering Features */

    }, {
        key: "addFeature",
        value: function addFeature(feature) {
            this.updateFeature(feature);
        }
    }, {
        key: "setActiveLayer",
        value: function setActiveLayer(index) {
            this.activeLayer = index;
            if (this.activeLayer != null && this.activeLayer >= 0) this.showActiveLayer();
        }
    }, {
        key: "showActiveLayer",
        value: function showActiveLayer() {
            this.featureLayer.remove();
            this.featureLayer = new paper.Group();
            for (var i = 0; i < this.paperLayers.length; i++) {
                this.featureLayer.addChild(this.paperLayers[i]);
            }
            if (this.layerMask) this.layerMask.remove();
            this.layerMask = DeviceRenderer.renderLayerMask(Registry.currentDevice);
            this.featureLayer.addChild(this.layerMask);
            var activeLayer = this.paperLayers[this.activeLayer];
            activeLayer.bringToFront();
        }
    }, {
        key: "comparePaperFeatureHeights",
        value: function comparePaperFeatureHeights(a, b) {
            var aFeature = Registry.currentDevice.getFeatureByID(a.featureID);
            var bFeature = Registry.currentDevice.getFeatureByID(b.featureID);
            var aHeight = aFeature.getValue("height");
            var bHeight = bFeature.getValue("height");
            return aHeight - bHeight;
        }
    }, {
        key: "insertChildByHeight",
        value: function insertChildByHeight(group, newChild) {
            this.getIndexByHeight(group.children, newChild);
            var index = this.getIndexByHeight(group.children, newChild);
            group.insertChild(index, newChild);
        }

        // TODO: Could be done faster with a binary search. Probably not needed!
    }, {
        key: "getIndexByHeight",
        value: function getIndexByHeight(children, newChild) {
            for (var i = 0; i < children.length; i++) {
                var test = this.comparePaperFeatureHeights(children[i], newChild);
                if (test >= 0) {
                    return i;
                }
            }
            return children.length;
        }
    }, {
        key: "updateFeature",
        value: function updateFeature(feature) {
            var existingFeature = this.paperFeatures[feature.getID()];
            var selected = undefined;
            if (existingFeature) selected = existingFeature.selected;else selected = false;
            this.removeFeature(feature);
            var newPaperFeature = FeatureRenderer2D.renderFeature(feature);
            newPaperFeature.selected = selected;
            this.paperFeatures[newPaperFeature.featureID] = newPaperFeature;
            //TODO: This is terrible. Fix it. Fix it now.
            var index = feature.layer.device.layers.indexOf(feature.layer);
            var layer = this.paperLayers[index];
            this.insertChildByHeight(layer, newPaperFeature);
        }
    }, {
        key: "removeTarget",
        value: function removeTarget() {
            if (this.currentTarget) this.currentTarget.remove();
            this.currentTarget = null;
        }
    }, {
        key: "addTarget",
        value: function addTarget(featureType, set, position) {
            this.removeTarget();
            this.lastTargetType = featureType;
            this.lastTargetPosition = position;
            this.lastTargetSet = set;
            this.updateTarget();
        }
    }, {
        key: "updateTarget",
        value: function updateTarget() {
            this.removeTarget();
            if (this.lastTargetType && this.lastTargetPosition) {
                this.currentTarget = FeatureRenderer2D.renderTarget(this.lastTargetType, this.lastTargetSet, this.lastTargetPosition);
                this.uiLayer.addChild(this.currentTarget);
            }
        }
    }, {
        key: "removeFeature",
        value: function removeFeature(feature) {
            var paperFeature = this.paperFeatures[feature.getID()];
            if (paperFeature) paperFeature.remove();
            this.paperFeatures[feature.getID()] = null;
        }
    }, {
        key: "removeGrid",
        value: function removeGrid() {
            if (this.paperGrid) this.paperGrid.remove();
            this.paperGrid = null;
        }
    }, {
        key: "updateGrid",
        value: function updateGrid(grid) {
            this.removeGrid();
            var newPaperGrid = GridRenderer.renderGrid(grid);
            this.paperGrid = newPaperGrid;
            this.gridLayer.addChild(newPaperGrid);
        }
    }, {
        key: "moveCenter",
        value: function moveCenter(delta) {
            this.panAndZoom.moveCenter(delta);
        }
    }, {
        key: "adjustZoom",
        value: function adjustZoom(delta, point) {
            this.panAndZoom.adjustZoom(delta, point);
        }
    }, {
        key: "getFeaturesByViewElements",
        value: function getFeaturesByViewElements(paperFeatures) {
            var output = [];
            for (var i = 0; i < paperFeatures.length; i++) {
                output.push(Registry.currentDevice.getFeatureByID(paperFeatures[i].featureID));
            }
            return output;
        }
    }, {
        key: "initializeView",
        value: function initializeView() {
            var center = this.getDeviceCenter();
            var zoom = this.computeOptimalZoom();
            this.setCenter(center);
            this.setZoom(zoom);
        }
    }, {
        key: "getDeviceCenter",
        value: function getDeviceCenter() {
            var dev = Registry.currentDevice;
            var width = dev.params.getValue("width");
            var height = dev.params.getValue("height");
            return new paper.Point(width / 2, height / 2);
        }
    }, {
        key: "computeOptimalZoom",
        value: function computeOptimalZoom() {
            var borderMargin = 200; // pixels
            var dev = Registry.currentDevice;
            var deviceWidth = dev.params.getValue("width");
            var deviceHeight = dev.params.getValue("height");
            var canvasWidth = this.getCanvasWidth();
            var canvasHeight = this.getCanvasHeight();
            var maxWidth = undefined;
            var maxHeight = undefined;
            if (canvasWidth - borderMargin <= 0) maxWidth = canvasWidth;else maxWidth = canvasWidth - borderMargin;
            if (canvasHeight - borderMargin <= 0) maxHeight = canvasHeight;else maxHeight = canvasHeight - borderMargin;
            var widthRatio = deviceWidth / maxWidth;
            var heightRatio = deviceHeight / maxHeight;
            if (widthRatio > heightRatio) return 1 / widthRatio;else return 1 / heightRatio;
        }
    }, {
        key: "hitFeature",
        value: function hitFeature(point) {
            var onlyHitActiveLayer = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

            var hitOptions = {
                fill: true,
                tolerance: 5,
                guides: false
            };

            var target = undefined;

            if (onlyHitActiveLayer && this.activeLayer != null) {
                target = this.paperLayers[this.activeLayer];

                var result = target.hitTest(point, hitOptions);
                if (result) {
                    return result.item;
                }
            } else {
                for (var i = this.paperLayers.length - 1; i >= 0; i--) {
                    target = this.paperLayers[i];
                    var result = target.hitTest(point, hitOptions);
                    if (result) {
                        return result.item;
                    }
                }
            }
            return false;
        }
    }, {
        key: "hitFeaturesWithViewElement",
        value: function hitFeaturesWithViewElement(paperElement) {
            var onlyHitActiveLayer = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

            var output = [];
            if (onlyHitActiveLayer && this.activeLayer != null) {
                var layer = this.paperLayers[this.activeLayer];
                for (var i = 0; i < layer.children.length; i++) {
                    var child = layer.children[i];
                    if (paperElement.intersects(child) || child.isInside(paperElement.bounds)) {
                        output.push(child);
                    }
                }
            } else {
                for (var i = 0; i < this.paperLayers.length; i++) {
                    var layer = this.paperLayers[i];
                    for (var j = 0; j < layer.children.length; j++) {
                        var child = layer.children[j];
                        if (paperElement.intersects(child) || child.isInside(paperElement.bounds)) {
                            output.push(child);
                        }
                    }
                }
            }
            return output;
        }
    }]);

    return PaperView;
})();

module.exports = PaperView;

},{"../core/registry":57,"../utils/simpleQueue":69,"./PanAndZoom":70,"./colors":72,"./render2D/GridRenderer":76,"./render2D/deviceRenderer2D":77,"./render2D/featureRenderer2D":78}],76:[function(require,module,exports){
"use strict";

var Colors = require("../colors");

function renderGrid(grid) {
    var gridGroup = new paper.Group();
    gridGroup.addChild(makeHorizontalLines(grid));
    gridGroup.addChild(makeVerticalLines(grid));
    return gridGroup;
}

function vertLineSymbol(width, color) {
    return lineSymbol(paper.view.bounds.topLeft, paper.view.bounds.bottomLeft, width, color);
}

function horizLineSymbol(width, color) {
    return lineSymbol(paper.view.bounds.topLeft, paper.view.bounds.topRight, width, color);
}

function lineSymbol(start, end, width, color) {
    var line = paper.Path.Line({
        from: start,
        to: end,
        strokeWidth: width,
        strokeColor: color
    });
    line.strokeColor.alpha = .25;
    line.remove();
    return new paper.Symbol(line);
}

function isThick(val, origin, spacing, thickCount) {
    var diff = Math.abs(val - origin);
    var remainder = diff % (spacing * thickCount);
    if (remainder < spacing) {
        return true;
    } else return false;
}

function makeVerticalLines(grid) {
    var spacing = grid.getSpacing();
    var sym = vertLineSymbol(grid.getThinWidth(), grid.color);
    var thickSym = vertLineSymbol(grid.getThickWidth(), grid.color);
    var start = paper.view.bounds.topLeft;
    var end = paper.view.bounds.topRight;
    var height = paper.view.bounds.height;
    var group = new paper.Group();

    var startX = Math.floor((start.x - grid.origin.x) / spacing) * spacing + grid.origin.x;

    for (var i = startX; i < end.x; i += spacing) {
        var pos = new paper.Point(i, start.y + height / 2);
        if (isThick(i, grid.origin.x, spacing, grid.thickCount)) group.addChild(thickSym.place(pos));else group.addChild(sym.place(pos));
    }

    for (var i = startX; i >= end.x; i -= spacing) {
        var pos = new paper.Point(i, start.y + height / 2);
        if (isThick(i, grid.origin.x, spacing, grid.thickCount)) group.addChild(thickSym.place(pos));else group.addChild(sym.place(pos));
    }
    return group;
}

function makeHorizontalLines(grid) {
    var spacing = grid.getSpacing();
    var sym = horizLineSymbol(grid.getThinWidth(), grid.color);
    var thickSym = horizLineSymbol(grid.getThickWidth(), grid.color);
    var start = paper.view.bounds.topLeft;
    var end = paper.view.bounds.bottomLeft;
    var width = paper.view.bounds.width;
    var group = new paper.Group();

    var startY = Math.floor((start.y - grid.origin.y) / spacing) * spacing + grid.origin.y;

    for (var i = startY; i < end.y; i += spacing) {
        var pos = new paper.Point(start.x + width / 2, i);
        if (isThick(i, grid.origin.y, spacing, grid.thickCount)) group.addChild(thickSym.place(pos));else group.addChild(sym.place(pos));
    }

    for (var i = startY; i >= end.y; i -= spacing) {
        var pos = new paper.Point(start.x + width / 2, i);
        if (isThick(i, grid.origin.y, spacing, grid.thickCount)) group.addChild(thickSym.place(pos));else group.addChild(sym.place(pos));
    }
    return group;
}

module.exports.renderGrid = renderGrid;

},{"../colors":72}],77:[function(require,module,exports){
"use strict";

var Colors = require("../colors");
var DEFAULT_STROKE_COLOR = Colors.GREY_700;
var BORDER_THICKNESS = 5; // pixels

function renderLayerMask(device) {
    var width = device.params.getValue("width");
    var height = device.params.getValue("height");
    var mask = new paper.Path.Rectangle({
        from: new paper.Point(0, 0),
        to: new paper.Point(width, height),
        fillColor: Colors.WHITE,
        strokeColor: null
    });
    mask.fillColor.alpha = .5;
    return mask;
}

function renderDevice(device) {
    var strokeColor = arguments.length <= 1 || arguments[1] === undefined ? DEFAULT_STROKE_COLOR : arguments[1];

    var background = new paper.Path.Rectangle({
        from: paper.view.bounds.topLeft.subtract(paper.view.size),
        to: paper.view.bounds.bottomRight.add(paper.view.size),
        fillColor: Colors.BLUE_50,
        strokeColor: null
    });
    var thickness = BORDER_THICKNESS / paper.view.zoom;
    var width = device.params.getValue("width");
    var height = device.params.getValue("height");
    var border = new paper.Path.Rectangle({
        from: new paper.Point(0, 0),
        to: new paper.Point(width, height),
        fillColor: Colors.WHITE,
        strokeColor: strokeColor,
        strokeWidth: thickness
    });

    var group = new paper.Group([background, border]);

    return group;
}

module.exports.renderDevice = renderDevice;
module.exports.renderLayerMask = renderLayerMask;

},{"../colors":72}],78:[function(require,module,exports){
"use strict";

var Colors = require("../colors");
var Feature = require("../../core/feature");
var PrimitiveSets2D = require("./primitiveSets2D");
var FeatureSets = require("../../featureSets");

function getLayerColor(feature) {
    var height = feature.getValue("height");
    var layerHeight = feature.layer.estimateLayerHeight();
    var decimal = height / layerHeight;
    if (decimal > 1) decimal = 1;
    if (!feature.layer.flip) decimal = 1 - decimal;
    var targetColorSet = Colors.getLayerColors(feature.layer);
    return Colors.decimalToLayerColor(decimal, targetColorSet, Colors.darkColorKeys);
}

function getBaseColor(feature) {
    var decimal = 0;
    if (!feature.layer.flip) decimal = 1 - decimal;
    var targetColorSet = Colors.getLayerColors(feature.layer);
    return Colors.decimalToLayerColor(decimal, targetColorSet, Colors.darkColorKeys);
}

function getDefaultValueForType(typeString, setString, key) {
    return Feature.getDefaultsForType(typeString, setString)[key];
}

function getFeatureRenderer(typeString, setString) {
    var rendererInfo = FeatureSets.getRender2D(typeString, setString);
    return rendererInfo;
}

function getPrimitive2D(typeString, setString) {
    return PrimitiveSets2D[setString][typeString];
}

function renderTarget(typeString, setString, position) {
    var renderer = getFeatureRenderer(typeString, setString);
    var params = renderer.targetParams;
    var prim = getPrimitive2D(renderer.targetPrimitiveType, renderer.targetPrimitiveSet);
    var primParams = {};
    for (var key in params) {
        primParams[key] = getDefaultValueForType(typeString, setString, params[key]);
    }
    primParams["position"] = position;
    primParams["color"] = Colors.getDefaultFeatureColor(typeString, setString, Registry.currentLayer);
    var rendered = prim(primParams);
    return rendered;
}

function renderFeature(feature) {
    var type = feature.getType();
    var set = feature.getSet();
    var renderer = getFeatureRenderer(type, set);
    var params = renderer.featureParams;
    var prim = getPrimitive2D(renderer.featurePrimitiveType, renderer.featurePrimitiveSet);
    var primParams = {};
    for (var key in params) {
        primParams[key] = feature.getValue(params[key]);
    }
    primParams["color"] = getLayerColor(feature);
    primParams["baseColor"] = getBaseColor(feature);
    var rendered = prim(primParams);
    rendered.featureID = feature.getID();
    return rendered;
}

module.exports.renderFeature = renderFeature;
module.exports.renderTarget = renderTarget;

},{"../../core/feature":47,"../../featureSets":65,"../colors":72,"./primitiveSets2D":80}],79:[function(require,module,exports){
"use strict";

var RoundedRectLine = function RoundedRectLine(params) {
    var start = params["start"];
    var end = params["end"];
    var color = params["color"];
    var width = params["width"];
    var baseColor = params["baseColor"];
    var startPoint = new paper.Point(start[0], start[1]);
    var endPoint = new paper.Point(end[0], end[1]);
    var vec = endPoint.subtract(startPoint);
    var rec = paper.Path.Rectangle({
        size: [vec.length + width, width],
        point: start,
        radius: width / 2,
        fillColor: color
    });
    rec.translate([-width / 2, -width / 2]);
    rec.rotate(vec.angle, start);
    return rec;
};

var RoundedRect = function RoundedRect(params) {
    var start = params["start"];
    var end = params["end"];
    var borderWidth = params["borderWidth"];
    var color = params["color"];
    var baseColor = params["baseColor"];
    var startX = undefined;
    var startY = undefined;
    var endX = undefined;
    var endY = undefined;

    if (start[0] < end[0]) {
        startX = start[0];
        endX = end[0];
    } else {
        startX = end[0];
        endX = start[0];
    }
    if (start[1] < end[1]) {
        startY = start[1];
        endY = end[1];
    } else {
        startY = end[1];
        endY = start[1];
    }

    startX -= borderWidth / 2;
    startY -= borderWidth / 2;
    endX += borderWidth / 2;
    endY += borderWidth / 2;

    var startPoint = new paper.Point(startX, startY);
    var endPoint = new paper.Point(endX, endY);

    var rec = paper.Path.Rectangle({
        from: startPoint,
        to: endPoint,
        radius: borderWidth / 2,
        fillColor: color
    });
    return rec;
};

var GradientCircle = function GradientCircle(params) {
    var position = params["position"];
    var radius1 = params["radius1"];
    var radius2 = params["radius2"];
    var color1 = params["color"];
    var color2 = params["baseColor"];
    var pos = new paper.Point(position);
    var ratio = radius2 / radius1;
    var targetRatio = undefined;
    var targetRadius = undefined;
    if (ratio > 1) {
        targetRatio = 1;
        targetRadius = radius2;
    } else {
        targetRatio = ratio;
        targetRadius = radius1;
    }
    var outerCircle = new paper.Path.Circle(pos, targetRadius);
    outerCircle.fillColor = {
        gradient: {
            stops: [[color1, targetRatio], [color2, targetRatio]],
            radial: true
        },
        origin: pos,
        destination: outerCircle.bounds.rightCenter
    };
    return outerCircle;
};

var CircleTarget = function CircleTarget(params) {
    var targetRadius = undefined;
    if (params.hasOwnProperty("diameter")) targetRadius = params["diameter"] / 2;else {
        var radius1 = params["radius1"];
        var radius2 = params["radius2"];
        if (radius1 > radius2) targetRadius = radius1;else targetRadius = radius2;
    }
    var minSize = 8; //pixels
    var minSizeInMicrometers = 8 / paper.view.zoom;
    var position = params["position"];
    var color = params["color"];
    var pos = new paper.Point(position[0], position[1]);
    if (targetRadius < minSizeInMicrometers) targetRadius = minSizeInMicrometers;
    var circ = new paper.Path.Circle(pos, targetRadius);
    circ.fillColor = color;
    circ.fillColor.alpha = .5;
    circ.strokeColor = "#FFFFFF";
    circ.strokeWidth = 3 / paper.view.zoom;
    if (circ.strokeWidth > targetRadius / 2) circ.strokeWidth = targetRadius / 2;
    return circ;
};

module.exports.RoundedRectLine = RoundedRectLine;
module.exports.GradientCircle = GradientCircle;
module.exports.RoundedRect = RoundedRect;
module.exports.CircleTarget = CircleTarget;

},{}],80:[function(require,module,exports){
"use strict";

module.exports.Basic2D = require("./basic2D");

},{"./basic2D":79}],81:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var OrbitControls = require("./threeLib/orbitControls");
var STLExporter = require("./threeLib/stlExporter");
var Detector = require("./threeLib/detector");
var getSTLString = STLExporter.getSTLString;
var Device3D = require("./primitiveSets3D").Device3D;
var renderFeature = require("./threeFeatureRenderer").renderFeature;
var Colors = require("../colors");

var SLIDE_HOLDER_MATERIAL = new THREE.MeshLambertMaterial({
	color: 0x9E9E9E,
	shading: THREE.SmoothShading
});
var SLIDE_GLASS_MATERIAL = new THREE.MeshLambertMaterial({
	color: 0xFFFFFF,
	opacity: 0.0,
	transparent: true
});
var DEVICE_PLANE_MATERIAL = new THREE.MeshBasicMaterial({
	color: 0xFFFFFF,
	shading: THREE.FlatShading
});

var HOLDER_BORDER_WIDTH = .41;
var INTERLOCK_TOLERANCE = .125;
var SLIDE_THICKNESS = 1.2;

var ThreeDeviceRenderer = (function () {
	function ThreeDeviceRenderer(renderContainer) {
		_classCallCheck(this, ThreeDeviceRenderer);

		this.container = renderContainer;
		this.camera;
		this.controls;
		this.scene;
		this.renderer;
		this.backgroundColor = Colors.BLUE_50;
		this.mockup = null;
		this.layers = null;
		this.json = null;
		this.initialY = 0;
		this.showingLayer = false;

		this.init();
		this.render();
	}

	_createClass(ThreeDeviceRenderer, [{
		key: "init",
		value: function init() {
			if (!Detector.webgl) Detector.addGetWebGLMessage();
			this.initCamera();
			this.initControls();
			this.initScene();
			this.initRenderer();
			var reference = this;
			window.addEventListener('resize', function () {
				reference.onWindowResize();
			}, false);
		}
	}, {
		key: "toggleLayerView",
		value: function toggleLayerView(index) {
			if (this.showingLayer) this.showMockup();else this.showLayer(index);
		}
	}, {
		key: "getLayerSTL",
		value: function getLayerSTL(json, index) {
			var scene = this.emptyScene();
			var layer = json.layers[index];
			scene.add(this.renderLayer(json, index, false));
			this.renderer.render(scene, this.camera);
			var string = getSTLString(scene);
			this.renderer.render(this.scene, this.camera);
			return getSTLString(scene);
		}
	}, {
		key: "getLayerSTLStrings",
		value: function getLayerSTLStrings(json) {
			var output = [];
			for (var i = 0; i < json.layers.length; i++) {
				output.push(this.getLayerSTL(json, i));
			}
			return output;
		}
	}, {
		key: "getSTL",
		value: function getSTL(json) {
			ThreeDeviceRenderer.sanitizeJSON(json);
			return this.getLayerSTLStrings(json);
		}
	}, {
		key: "initCamera",
		value: function initCamera() {
			this.camera = new THREE.PerspectiveCamera(60, this.container.clientWidth / this.container.clientHeight, 1, 1000);
			this.camera.position.z = 100;
		}
	}, {
		key: "initControls",
		value: function initControls() {
			this.controls = new THREE.OrbitControls(this.camera, this.container);
			this.controls.damping = 0.2;
			var reference = this;
			this.controls.addEventListener('change', function () {
				reference.render();
			});
		}
	}, {
		key: "emptyScene",
		value: function emptyScene() {
			var scene = new THREE.Scene();
			scene = new THREE.Scene();
			//lights
			var light1 = new THREE.DirectionalLight(0xffffff);
			light1.position.set(1, 1, 1);
			scene.add(light1);

			var light2 = new THREE.DirectionalLight(0xffffff);
			light2.position.set(-1, -1, -1);
			scene.add(light2);

			var light3 = new THREE.AmbientLight(0x333333);
			scene.add(light3);
			return scene;
		}
	}, {
		key: "initScene",
		value: function initScene() {
			this.scene = this.emptyScene();
		}
	}, {
		key: "initRenderer",
		value: function initRenderer() {
			this.renderer = new THREE.WebGLRenderer({
				antialias: true
			});
			this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
			this.renderer.setClearColor(this.backgroundColor, 1);
			this.container.appendChild(this.renderer.domElement);
		}
	}, {
		key: "onWindowResize",
		value: function onWindowResize() {
			this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
			this.render();
		}
	}, {
		key: "render",
		value: function render() {
			this.renderer.render(this.scene, this.camera);
		}
	}, {
		key: "setupCamera",
		value: function setupCamera(centerX, centerY, deviceHeight, pixelHeight, initialZoom) {
			this.controls.reset();
			this.camera.position.z = this.getCameraDistance(deviceHeight, pixelHeight);
			this.controls.panLeft(-centerX);
			this.controls.panUp(-centerY + deviceHeight);
			this.controls.update();
			this.initialY = this.camera.position.y;
			this.initialZoom = initialZoom;
		}
	}, {
		key: "getCameraCenterInMicrometers",
		value: function getCameraCenterInMicrometers() {
			var position = this.camera.position;
			return [position.x * 1000, (this.camera.position.y - this.initialY) * 1000];
		}
	}, {
		key: "getZoom",
		value: function getZoom() {
			var height = this.json.params.height / 1000;
			var distance = this.camera.position.z;
			if (distance < 0) {
				return this.initialZoom;
			}
			var pixels = this.computeHeightInPixels(height, distance);
			var zoom = pixels / this.json.params.height;
			return zoom;
		}
	}, {
		key: "getCameraDistance",
		value: function getCameraDistance(objectHeight, pixelHeight) {
			var vFOV = this.camera.fov * Math.PI / 180;
			var ratio = pixelHeight / this.container.clientHeight;
			var height = objectHeight / ratio;
			var distance = height / (2 * Math.tan(vFOV / 2));
			return distance;
		}
	}, {
		key: "computeHeightInPixels",
		value: function computeHeightInPixels(objectHeight, distance) {
			var vFOV = this.camera.fov * Math.PI / 180; //
			var height = 2 * Math.tan(vFOV / 2) * distance; // visible height
			var ratio = objectHeight / height;
			var pixels = this.container.clientHeight * ratio;
			return pixels;
		}
	}, {
		key: "loadDevice",
		value: function loadDevice(renderedDevice) {
			this.initScene();
			this.scene.add(renderedDevice);
			this.render();
		}
	}, {
		key: "showMockup",
		value: function showMockup() {
			if (this.mockup) {
				this.showingLayer = false;
				this.loadDevice(this.mockup);
			}
		}
	}, {
		key: "showLayer",
		value: function showLayer(index) {
			if (this.layers && this.json) {
				var layer = this.layers[index].clone();
				this.loadDevice(layer);
				this.showingLayer = true;
			}
		}
	}, {
		key: "loadJSON",
		value: function loadJSON(json) {
			this.json = json;
			ThreeDeviceRenderer.sanitizeJSON(json);
			this.mockup = this.renderMockup(json);
			this.layers = this.renderLayers(json);
		}
	}, {
		key: "renderFeatures",
		value: function renderFeatures(layer, z_offset) {
			var renderedFeatures = new THREE.Group();
			for (var featureID in layer.features) {
				var feature = layer.features[featureID];
				renderedFeatures.add(renderFeature(feature, layer, z_offset));
			}
			return renderedFeatures;
		}
	}, {
		key: "renderLayers",
		value: function renderLayers(json) {
			var renderedLayers = [];
			for (var i = 0; i < json.layers.length; i++) {
				renderedLayers.push(this.renderLayer(json, i, true));
			}
			return renderedLayers;
		}
	}, {
		key: "renderSlide",
		value: function renderSlide(width, height, thickness) {
			var slideMaterial = arguments.length <= 3 || arguments[3] === undefined ? SLIDE_GLASS_MATERIAL : arguments[3];
			var planeMaterial = arguments.length <= 4 || arguments[4] === undefined ? DEVICE_PLANE_MATERIAL : arguments[4];

			var slideParams = {
				width: width,
				height: height,
				thickness: thickness
			};

			var planeParams = {
				width: width,
				height: height
			};
			var slideGeometry = Device3D.Slide(slideParams);
			var planeGeometry = Device3D.DevicePlane(planeParams);
			var group = new THREE.Group();
			var planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
			var slideMesh = new THREE.Mesh(slideGeometry, slideMaterial);
			group.add(planeMesh);
			group.add(slideMesh);
			return group;
		}
	}, {
		key: "renderSlideHolder",
		value: function renderSlideHolder(width, height, slideThickness, borderWidth, interlock) {
			var material = arguments.length <= 5 || arguments[5] === undefined ? SLIDE_HOLDER_MATERIAL : arguments[5];

			var holderParams = {
				width: width,
				height: height,
				slideThickness: slideThickness,
				borderWidth: borderWidth,
				interlock: interlock
			};

			var holderGeometry = Device3D.SlideHolder(holderParams);
			var holderMesh = new THREE.Mesh(holderGeometry, material);
			return holderMesh;
		}
	}, {
		key: "renderSlideAssembly",
		value: function renderSlideAssembly(width, height) {
			var slide = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];
			var slideThickness = arguments.length <= 3 || arguments[3] === undefined ? SLIDE_THICKNESS : arguments[3];
			var borderWidth = arguments.length <= 4 || arguments[4] === undefined ? HOLDER_BORDER_WIDTH : arguments[4];
			var interlock = arguments.length <= 5 || arguments[5] === undefined ? INTERLOCK_TOLERANCE : arguments[5];

			var assembly = new THREE.Group();
			var holder = this.renderSlideHolder(width, height, slideThickness, borderWidth, interlock);
			assembly.add(holder);
			if (slide) {
				var _slide = this.renderSlide(width, height, slideThickness);
				assembly.add(_slide);
			}
			assembly.position.z -= slideThickness;
			return assembly;
		}
	}, {
		key: "renderLayer",
		value: function renderLayer(json, layerIndex) {
			var viewOnly = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

			var width = json.params.width;
			var height = json.params.height;
			var layer = json.layers[layerIndex];
			var renderedFeatures = new THREE.Group();
			var renderedLayer = new THREE.Group();
			if (viewOnly) renderedFeatures.add(this.renderFeatures(layer, layer.params.z_offset));else renderedFeatures.add(this.renderFeatures(layer, 0));
			if (layer.params.flip && !viewOnly) this.flipLayer(renderedFeatures, height, layer.params.z_offset);
			renderedLayer.add(renderedFeatures);
			var assembly = this.renderSlideAssembly(width, height, viewOnly);
			renderedLayer.add(assembly);
			return renderedLayer;
		}
	}, {
		key: "flipLayer",
		value: function flipLayer(layer, height, z_offset) {
			layer.rotation.x += Math.PI;
			layer.position.y += height;
			layer.position.z += z_offset;
		}
	}, {
		key: "renderMockup",
		value: function renderMockup(json) {
			var width = json.params.width;
			var height = json.params.height;
			var renderedMockup = new THREE.Group();
			var layers = json.layers;
			for (var i = 0; i < layers.length; i++) {
				var layer = layers[i];
				var renderedLayer = this.renderFeatures(layer, layer.params.z_offset);
				renderedMockup.add(renderedLayer);
			}
			var renderedHolder = this.renderSlideAssembly(width, height, true);
			renderedMockup.add(renderedHolder);
			return renderedMockup;
		}
	}, {
		key: "animate",
		value: (function (_animate) {
			function animate() {
				return _animate.apply(this, arguments);
			}

			animate.toString = function () {
				return _animate.toString();
			};

			return animate;
		})(function () {
			requestAnimationFrame(animate);
			this.controls.update();
		})
	}], [{
		key: "sanitizeJSON",
		value: function sanitizeJSON(json) {
			ThreeDeviceRenderer.sanitizeParams(json.params);
			for (var i = 0; i < json.layers.length; i++) {
				ThreeDeviceRenderer.sanitizeParams(json.layers[i].params, json.params.height);
				for (var key in json.layers[i].features) {
					ThreeDeviceRenderer.sanitizeParams(json.layers[i].features[key].params, json.params.height);
				}
			}
		}
	}, {
		key: "sanitizeParams",
		value: function sanitizeParams(params, height) {
			for (var key in params) {
				if (key == "start" || key == "end" || key == "position") {
					var pos = params[key];
					params[key] = [pos[0] / 1000, height - pos[1] / 1000];
				} else {
					params[key] = params[key] / 1000;
				}
			}
		}
	}]);

	return ThreeDeviceRenderer;
})();

module.exports = ThreeDeviceRenderer;

},{"../colors":72,"./primitiveSets3D":84,"./threeFeatureRenderer":85,"./threeLib/detector":86,"./threeLib/orbitControls":87,"./threeLib/stlExporter":88}],82:[function(require,module,exports){
"use strict";

var mergeGeometries = require("../threeUtils").mergeGeometries;
var CONE_SEGMENTS = 16;

function TwoPointRoundedLineFeature(params, flip, z_offset) {
	var start = params.start;
	var end = params.end;
	var width = params.width;
	var height = params.height;
	var box = TwoPointRoundedLine({
		start: start,
		end: end,
		width: width,
		height: height
	});
	var matrix = new THREE.Matrix4();

	if (flip) {
		box.applyMatrix(matrix.makeTranslation(0, 0, -height));
	}
	box.applyMatrix(matrix.makeTranslation(0, 0, z_offset));
	return box;
}

function TwoPointRoundedBoxFeature(params, flip, z_offset) {
	var start = params.start;
	var end = params.end;
	var borderWidth = params.borderWidth;
	var height = params.height;
	var box = TwoPointRoundedBox({
		start: start,
		end: end,
		borderWidth: borderWidth,
		height: height
	});
	var matrix = new THREE.Matrix4();
	if (flip) {
		box.applyMatrix(matrix.makeTranslation(0, 0, -height));
	}
	box.applyMatrix(matrix.makeTranslation(0, 0, z_offset));
	return box;
}

function Cone(params) {
	var position = params.position;
	var radius1 = params.radius1;
	var radius2 = params.radius2;
	var height = params.height;
	var cyl = new THREE.CylinderGeometry(radius2, radius1, height, CONE_SEGMENTS);
	var matrix = new THREE.Matrix4();
	cyl.applyMatrix(matrix.makeRotationX(Math.PI / 2));
	cyl.applyMatrix(matrix.makeTranslation(position[0], position[1], height / 2));
	return cyl;
}

function TwoPointLine(params) {
	var start = params.start;
	var end = params.end;
	var width = params.width;
	var height = params.height;
	var dX = end[0] - start[0];
	var dY = end[1] - start[1];
	var boxAngle = Math.atan2(dY, dX);
	var dXPow = Math.pow(dX, 2);
	var dYPow = Math.pow(dY, 2);
	var length = Math.sqrt(dXPow + dYPow);
	var box = new THREE.BoxGeometry(length, width, height);
	var matrix = new THREE.Matrix4();
	box.applyMatrix(matrix.makeRotationZ(boxAngle));
	box.applyMatrix(matrix.makeTranslation(start[0], start[1], height / 2));
	box.applyMatrix(matrix.makeTranslation(dX / 2, dY / 2, 0));
	return box;
}

function TwoPointRoundedBox(params) {
	var start = params.start;
	var end = params.end;
	var borderWidth = params.borderWidth;
	var height = params.height;
	var startX = undefined;
	var startY = undefined;
	var endX = undefined;
	var endY = undefined;

	if (start[0] < end[0]) {
		startX = start[0];
		endX = end[0];
	} else {
		startX = end[0];
		endX = start[0];
	}
	if (start[1] < end[1]) {
		startY = start[1];
		endY = end[1];
	} else {
		startY = end[1];
		endY = start[1];
	}

	var w = endX - startX;
	var h = endY - startY;
	var bottomLeft = [startX, startY];
	var bottomRight = [endX, startY];
	var topLeft = [startX, endY];
	var topRight = [endX, endY];

	var core = new THREE.BoxGeometry(w, h, height);
	var matrix = new THREE.Matrix4();
	core.applyMatrix(matrix.makeTranslation(w / 2, h / 2, height / 2));
	core.applyMatrix(matrix.makeTranslation(bottomLeft[0], bottomLeft[1], 0));
	var left = TwoPointRoundedLine({
		start: bottomLeft,
		end: topLeft,
		width: borderWidth,
		height: height
	});
	var top = TwoPointRoundedLine({
		start: topLeft,
		end: topRight,
		width: borderWidth,
		height: height
	});
	var right = TwoPointRoundedLine({
		start: topRight,
		end: bottomRight,
		width: borderWidth,
		height: height
	});
	var down = TwoPointRoundedLine({
		start: bottomRight,
		end: bottomLeft,
		width: borderWidth,
		height: height
	});
	var geom = mergeGeometries([core, left, top, right, down]);
	return geom;
}

function ConeFeature(params, flip, z_offset) {
	var position = params.position;
	var radius1 = params.radius1;
	var radius2 = params.radius2;
	var height = params.height;
	var cone = Cone({
		position: position,
		radius1: radius1,
		radius2: radius2,
		height: height
	});
	var matrix = new THREE.Matrix4();
	if (flip) {
		cone.applyMatrix(matrix.makeRotationX(Math.PI));
		cone.applyMatrix(matrix.makeTranslation(0, position[1] * 2, 0));
	}
	cone.applyMatrix(matrix.makeTranslation(0, 0, z_offset));
	return cone;
}

function TwoPointRoundedLine(params) {
	var start = params.start;
	var end = params.end;
	var width = params.width;
	var height = params.height;
	var box = TwoPointLine({
		start: start,
		end: end,
		width: width,
		height: height
	});
	var cone1 = Cone({
		position: start,
		radius1: width / 2,
		radius2: width / 2,
		height: height
	});
	var cone2 = Cone({
		position: end,
		radius1: width / 2,
		radius2: width / 2,
		height: height
	});
	var merged = mergeGeometries([box, cone1, cone2]);
	return merged;
}

module.exports.TwoPointRoundedLine = TwoPointRoundedLine;
module.exports.TwoPointRoundedBox = TwoPointRoundedBox;
module.exports.TwoPointRoundedBoxFeature = TwoPointRoundedBoxFeature;
module.exports.TwoPointRoundedLineFeature = TwoPointRoundedLineFeature;
module.exports.TwoPointLine = TwoPointLine;
module.exports.ConeFeature = ConeFeature;

},{"../threeUtils":89}],83:[function(require,module,exports){
"use strict";

var Basic3D = require("./basic3D");
var ThreeUtils = require("../threeUtils");
var TwoPointRoundedLine = Basic3D.TwoPointRoundedLine;
var mergeGeometries = ThreeUtils.mergeGeometries;

var HOLDER_BORDER_WIDTH = .41;
var INTERLOCK_TOLERANCE = .125;
var SLIDE_THICKNESS = 1.2;

function Slide(params) {
	var width = params.width;
	var height = params.height;
	var thickness = params.thickness;
	var slide = new THREE.BoxGeometry(width, height, thickness);
	var matrix = new THREE.Matrix4();
	slide.applyMatrix(matrix.makeTranslation(width / 2, height / 2, thickness / 2));
	return slide;
}

function SlideHolder(params) {
	var width = params.width;
	var height = params.height;
	var slideThickness = params.slideThickness;
	var borderWidth = params.borderWidth;
	var interlock = params.interlock;
	var w = borderWidth;
	var i = interlock;
	var h = slideThickness;
	var bottomLeft = [-w / 2 - i, -w / 2 - i];
	var topLeft = [-w / 2 - i, height + w / 2 + i];
	var topRight = [width + w / 2 + i, height + w / 2 + i];
	var bottomRight = [width + w / 2 + i, -w / 2 - i];
	var leftBar = TwoPointRoundedLine({
		start: bottomLeft,
		end: topLeft,
		width: w,
		height: h
	});
	var topBar = TwoPointRoundedLine({
		start: topLeft,
		end: topRight,
		width: w,
		height: h
	});

	var rightBar = TwoPointRoundedLine({
		start: topRight,
		end: bottomRight,
		width: w,
		height: h
	});

	var bottomBar = TwoPointRoundedLine({
		start: bottomRight,
		end: bottomLeft,
		width: w,
		height: h
	});

	var border = mergeGeometries([leftBar, topBar, rightBar, bottomBar]);
	return border;
}

function DevicePlane(params) {
	var width = params.width;
	var height = params.height;
	var plane = new THREE.PlaneBufferGeometry(width, height);
	var matrix = new THREE.Matrix4();
	plane.applyMatrix(matrix.makeTranslation(width / 2, height / 2, 0));
	return plane;
}

module.exports.Slide = Slide;
module.exports.DevicePlane = DevicePlane;
module.exports.SlideHolder = SlideHolder;

},{"../threeUtils":89,"./basic3D":82}],84:[function(require,module,exports){
"use strict";

module.exports.Basic3D = require("./basic3D");
module.exports.Device3D = require("./device3D");

},{"./basic3D":82,"./device3D":83}],85:[function(require,module,exports){
"use strict";

var PrimitiveSets3D = require("./primitiveSets3D");
var FeatureSets = require("../../featureSets");

var layerMaterials = {
	"red": new THREE.MeshLambertMaterial({
		color: 0xF44336,
		shading: THREE.SmoothShading
	}),
	"indigo": new THREE.MeshLambertMaterial({
		color: 0x3F51B5,
		shading: THREE.SmoothShading
	}),
	"purple": new THREE.MeshLambertMaterial({
		color: 0x673AB7,
		shading: THREE.SmoothShading
	}),
	"grey": new THREE.MeshLambertMaterial({
		color: 0x9E9E9E,
		shading: THREE.SmoothShading
	})
};

function getFeatureMaterial(layer) {
	var colorString = layer.color;
	if (colorString && layerMaterials.hasOwnProperty(colorString)) {
		return layerMaterials[colorString];
	} else return layerMaterials["grey"];
}

function makeParams(feature, renderInfo) {
	var params = {};
	var featureParams = renderInfo.featureParams;
	for (var key in featureParams) {
		var target = featureParams[key];
		if (target == undefined || !feature.params.hasOwnProperty(target)) throw new Error("Key value: " + key + " for value: " + target + " not found in renderInfo.");
		var value = feature.params[target];
		params[key] = value;
	}
	return params;
}

function getRenderInfo(type, set) {
	return FeatureSets.getRender3D(type, set);
}

function renderFeature(feature, layer, z_offset) {
	var flip = layer.params.flip;
	var type = feature.type;
	var set = feature.set;
	var renderInfo = getRenderInfo(type, set);
	var renderingSet = renderInfo.featurePrimitiveSet;
	var renderingPrimitive = renderInfo.featurePrimitive;
	var primSet = PrimitiveSets3D[renderingSet];
	var targetFunction = PrimitiveSets3D[renderingSet][renderingPrimitive];
	var params = makeParams(feature, renderInfo);
	var geom = targetFunction(params, flip, z_offset);
	var material = getFeatureMaterial(layer);
	var renderedFeature = new THREE.Mesh(geom, material);
	return renderedFeature;
}

module.exports.renderFeature = renderFeature;

},{"../../featureSets":65,"./primitiveSets3D":84}],86:[function(require,module,exports){
/**
 * @author alteredq / http://alteredqualia.com/
 * @author mr.doob / http://mrdoob.com/
 */

'use strict';

var Detector = {

		canvas: !!window.CanvasRenderingContext2D,
		webgl: (function () {
				try {
						var canvas = document.createElement('canvas');return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
				} catch (e) {
						return false;
				}
		})(),
		workers: !!window.Worker,
		fileapi: window.File && window.FileReader && window.FileList && window.Blob,

		getWebGLErrorMessage: function getWebGLErrorMessage() {

				var element = document.createElement('div');
				element.id = 'webgl-error-message';
				element.style.fontFamily = 'monospace';
				element.style.fontSize = '13px';
				element.style.fontWeight = 'normal';
				element.style.textAlign = 'center';
				element.style.background = '#fff';
				element.style.color = '#000';
				element.style.padding = '1.5em';
				element.style.width = '400px';
				element.style.margin = '5em auto 0';

				if (!this.webgl) {

						element.innerHTML = window.WebGLRenderingContext ? ['Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />', 'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join('\n') : ['Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>', 'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join('\n');
				}

				return element;
		},

		addGetWebGLMessage: function addGetWebGLMessage(parameters) {

				var parent, id, element;

				parameters = parameters || {};

				parent = parameters.parent !== undefined ? parameters.parent : document.body;
				id = parameters.id !== undefined ? parameters.id : 'oldie';

				element = Detector.getWebGLErrorMessage();
				element.id = id;

				parent.appendChild(element);
		}

};

// browserify support
if (typeof module === 'object') {

		module.exports = Detector;
}

},{}],87:[function(require,module,exports){
/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 */
/*global THREE, console */

// This set of controls performs orbiting, dollying (zooming), and panning. It maintains
// the "up" direction as +Y, unlike the TrackballControls. Touch on tablet and phones is
// supported.
//
//    Orbit - left mouse / touch: one finger move
//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
//    Pan - right mouse, or arrow keys / touch: three finter swipe

'use strict';

THREE.OrbitControls = function (object, domElement) {

		this.object = object;
		this.domElement = domElement !== undefined ? domElement : document;

		// API

		// Set to false to disable this control
		this.enabled = true;

		// "target" sets the location of focus, where the control orbits around
		// and where it pans with respect to.
		this.target = new THREE.Vector3();

		// center is old, deprecated; use "target" instead
		this.center = this.target;

		// This option actually enables dollying in and out; left as "zoom" for
		// backwards compatibility
		this.noZoom = false;
		this.zoomSpeed = 1.0;

		// Limits to how far you can dolly in and out ( PerspectiveCamera only )
		this.minDistance = 0;
		this.maxDistance = Infinity;

		// Limits to how far you can zoom in and out ( OrthographicCamera only )
		this.minZoom = 0;
		this.maxZoom = Infinity;

		// Set to true to disable this control
		this.noRotate = false;
		this.rotateSpeed = 1.0;

		// Set to true to disable this control
		this.noPan = false;
		this.keyPanSpeed = 7.0; // pixels moved per arrow key push

		// Set to true to automatically rotate around the target
		this.autoRotate = false;
		this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

		// How far you can orbit vertically, upper and lower limits.
		// Range is 0 to Math.PI radians.
		this.minPolarAngle = 0; // radians
		this.maxPolarAngle = Math.PI; // radians

		// How far you can orbit horizontally, upper and lower limits.
		// If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
		this.minAzimuthAngle = -Math.PI; // radians
		this.maxAzimuthAngle = Math.PI; // radians

		// Set to true to disable use of the keys
		this.noKeys = false;

		// The four arrow keys
		this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

		// Mouse buttons
		//this.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };
		this.mouseButtons = { ORBIT: THREE.MOUSE.RIGHT, PAN: THREE.MOUSE.MIDDLE };

		////////////
		// internals

		var scope = this;

		var EPS = 0.000001;

		var rotateStart = new THREE.Vector2();
		var rotateEnd = new THREE.Vector2();
		var rotateDelta = new THREE.Vector2();

		var panStart = new THREE.Vector2();
		var panEnd = new THREE.Vector2();
		var panDelta = new THREE.Vector2();
		var panOffset = new THREE.Vector3();

		var offset = new THREE.Vector3();

		var dollyStart = new THREE.Vector2();
		var dollyEnd = new THREE.Vector2();
		var dollyDelta = new THREE.Vector2();

		var theta;
		var phi;
		var phiDelta = 0;
		var thetaDelta = 0;
		var scale = 1;
		var pan = new THREE.Vector3();

		var lastPosition = new THREE.Vector3();
		var lastQuaternion = new THREE.Quaternion();

		var STATE = { NONE: -1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_DOLLY: 4, TOUCH_PAN: 5 };

		var state = STATE.NONE;

		// for reset

		this.target0 = this.target.clone();
		this.position0 = this.object.position.clone();
		this.zoom0 = this.object.zoom;

		// so camera.up is the orbit axis

		var quat = new THREE.Quaternion().setFromUnitVectors(object.up, new THREE.Vector3(0, 1, 0));
		var quatInverse = quat.clone().inverse();

		// events

		var changeEvent = { type: 'change' };
		var startEvent = { type: 'start' };
		var endEvent = { type: 'end' };

		this.rotateLeft = function (angle) {

				if (angle === undefined) {

						angle = getAutoRotationAngle();
				}

				thetaDelta -= angle;
		};

		this.rotateUp = function (angle) {

				if (angle === undefined) {

						angle = getAutoRotationAngle();
				}

				phiDelta -= angle;
		};

		// pass in distance in world space to move left
		this.panLeft = function (distance) {

				var te = this.object.matrix.elements;

				// get X column of matrix
				panOffset.set(te[0], te[1], te[2]);
				panOffset.multiplyScalar(-distance);

				pan.add(panOffset);
		};

		// pass in distance in world space to move up
		this.panUp = function (distance) {

				var te = this.object.matrix.elements;

				// get Y column of matrix
				panOffset.set(te[4], te[5], te[6]);
				panOffset.multiplyScalar(distance);

				pan.add(panOffset);
		};

		// pass in x,y of change desired in pixel space,
		// right and down are positive
		this.pan = function (deltaX, deltaY) {

				var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

				if (scope.object instanceof THREE.PerspectiveCamera) {

						// perspective
						var position = scope.object.position;
						var offset = position.clone().sub(scope.target);
						var targetDistance = offset.length();

						// half of the fov is center to top of screen
						targetDistance *= Math.tan(scope.object.fov / 2 * Math.PI / 180.0);

						// we actually don't use screenWidth, since perspective camera is fixed to screen height
						scope.panLeft(2 * deltaX * targetDistance / element.clientHeight);
						scope.panUp(2 * deltaY * targetDistance / element.clientHeight);
				} else if (scope.object instanceof THREE.OrthographicCamera) {

						// orthographic
						scope.panLeft(deltaX * (scope.object.right - scope.object.left) / element.clientWidth);
						scope.panUp(deltaY * (scope.object.top - scope.object.bottom) / element.clientHeight);
				} else {

						// camera neither orthographic or perspective
						console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.');
				}
		};

		this.dollyIn = function (dollyScale) {

				if (dollyScale === undefined) {

						dollyScale = getZoomScale();
				}

				if (scope.object instanceof THREE.PerspectiveCamera) {

						scale /= dollyScale;
				} else if (scope.object instanceof THREE.OrthographicCamera) {

						scope.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom * dollyScale));
						scope.object.updateProjectionMatrix();
						scope.dispatchEvent(changeEvent);
				} else {

						console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
				}
		};

		this.dollyOut = function (dollyScale) {

				if (dollyScale === undefined) {

						dollyScale = getZoomScale();
				}

				if (scope.object instanceof THREE.PerspectiveCamera) {

						scale *= dollyScale;
				} else if (scope.object instanceof THREE.OrthographicCamera) {

						scope.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / dollyScale));
						scope.object.updateProjectionMatrix();
						scope.dispatchEvent(changeEvent);
				} else {

						console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
				}
		};

		this.update = function () {

				var position = this.object.position;

				offset.copy(position).sub(this.target);

				// rotate offset to "y-axis-is-up" space
				offset.applyQuaternion(quat);

				// angle from z-axis around y-axis

				theta = Math.atan2(offset.x, offset.z);

				// angle from y-axis

				phi = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y);

				if (this.autoRotate && state === STATE.NONE) {

						this.rotateLeft(getAutoRotationAngle());
				}

				theta += thetaDelta;
				phi += phiDelta;

				// restrict theta to be between desired limits
				theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, theta));

				// restrict phi to be between desired limits
				phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, phi));

				// restrict phi to be betwee EPS and PI-EPS
				phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));

				var radius = offset.length() * scale;

				// restrict radius to be between desired limits
				radius = Math.max(this.minDistance, Math.min(this.maxDistance, radius));

				// move target to panned location
				this.target.add(pan);

				offset.x = radius * Math.sin(phi) * Math.sin(theta);
				offset.y = radius * Math.cos(phi);
				offset.z = radius * Math.sin(phi) * Math.cos(theta);

				// rotate offset back to "camera-up-vector-is-up" space
				offset.applyQuaternion(quatInverse);

				position.copy(this.target).add(offset);

				this.object.lookAt(this.target);

				thetaDelta = 0;
				phiDelta = 0;
				scale = 1;
				pan.set(0, 0, 0);

				// update condition is:
				// min(camera displacement, camera rotation in radians)^2 > EPS
				// using small-angle approximation cos(x/2) = 1 - x^2 / 8

				if (lastPosition.distanceToSquared(this.object.position) > EPS || 8 * (1 - lastQuaternion.dot(this.object.quaternion)) > EPS) {

						this.dispatchEvent(changeEvent);

						lastPosition.copy(this.object.position);
						lastQuaternion.copy(this.object.quaternion);
				}
		};

		this.reset = function () {

				state = STATE.NONE;

				this.target.copy(this.target0);
				this.object.position.copy(this.position0);
				this.object.zoom = this.zoom0;

				this.object.updateProjectionMatrix();
				this.dispatchEvent(changeEvent);

				this.update();
		};

		this.getPolarAngle = function () {

				return phi;
		};

		this.getAzimuthalAngle = function () {

				return theta;
		};

		function getAutoRotationAngle() {

				return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
		}

		function getZoomScale() {

				return Math.pow(0.95, scope.zoomSpeed);
		}

		function onMouseDown(event) {

				if (scope.enabled === false) return;
				event.preventDefault();

				if (event.button === scope.mouseButtons.ORBIT) {
						if (scope.noRotate === true) return;

						state = STATE.ROTATE;

						rotateStart.set(event.clientX, event.clientY);
				} else if (event.button === scope.mouseButtons.ZOOM) {
						if (scope.noZoom === true) return;

						state = STATE.DOLLY;

						dollyStart.set(event.clientX, event.clientY);

						// map left mouse and middle mouse both to pan. Because I'm terrible.
				} else if (event.button === scope.mouseButtons.PAN || event.button == THREE.MOUSE.LEFT) {
								if (scope.noPan === true) return;

								state = STATE.PAN;

								panStart.set(event.clientX, event.clientY);
						}

				if (state !== STATE.NONE) {
						document.addEventListener('mousemove', onMouseMove, false);
						document.addEventListener('mouseup', onMouseUp, false);
						scope.dispatchEvent(startEvent);
				}
		}

		function onMouseMove(event) {

				if (scope.enabled === false) return;

				event.preventDefault();

				var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

				if (state === STATE.ROTATE) {

						if (scope.noRotate === true) return;

						rotateEnd.set(event.clientX, event.clientY);
						rotateDelta.subVectors(rotateEnd, rotateStart);

						// rotating across whole screen goes 360 degrees around
						scope.rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed);

						// rotating up and down along whole screen attempts to go 360, but limited to 180
						scope.rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed);

						rotateStart.copy(rotateEnd);
				} else if (state === STATE.DOLLY) {

						if (scope.noZoom === true) return;

						dollyEnd.set(event.clientX, event.clientY);
						dollyDelta.subVectors(dollyEnd, dollyStart);

						if (dollyDelta.y > 0) {

								scope.dollyIn();
						} else if (dollyDelta.y < 0) {

								scope.dollyOut();
						}

						dollyStart.copy(dollyEnd);
				} else if (state === STATE.PAN) {

						if (scope.noPan === true) return;

						panEnd.set(event.clientX, event.clientY);
						panDelta.subVectors(panEnd, panStart);

						scope.pan(panDelta.x, panDelta.y);

						panStart.copy(panEnd);
				}

				if (state !== STATE.NONE) scope.update();
		}

		function onMouseUp() /* event */{

				if (scope.enabled === false) return;

				document.removeEventListener('mousemove', onMouseMove, false);
				document.removeEventListener('mouseup', onMouseUp, false);
				scope.dispatchEvent(endEvent);
				state = STATE.NONE;
		}

		function onMouseWheel(event) {

				if (scope.enabled === false || scope.noZoom === true || state !== STATE.NONE) return;

				event.preventDefault();
				event.stopPropagation();

				var delta = 0;

				if (event.wheelDelta !== undefined) {
						// WebKit / Opera / Explorer 9

						delta = event.wheelDelta;
				} else if (event.detail !== undefined) {
						// Firefox

						delta = -event.detail;
				}

				if (delta > 0) {

						scope.dollyOut();
				} else if (delta < 0) {

						scope.dollyIn();
				}

				scope.update();
				scope.dispatchEvent(startEvent);
				scope.dispatchEvent(endEvent);
		}

		function onKeyDown(event) {

				if (scope.enabled === false || scope.noKeys === true || scope.noPan === true) return;

				switch (event.keyCode) {

						case scope.keys.UP:
								scope.pan(0, scope.keyPanSpeed);
								scope.update();
								break;

						case scope.keys.BOTTOM:
								scope.pan(0, -scope.keyPanSpeed);
								scope.update();
								break;

						case scope.keys.LEFT:
								scope.pan(scope.keyPanSpeed, 0);
								scope.update();
								break;

						case scope.keys.RIGHT:
								scope.pan(-scope.keyPanSpeed, 0);
								scope.update();
								break;

				}
		}

		function touchstart(event) {

				if (scope.enabled === false) return;

				switch (event.touches.length) {

						case 1:
								// one-fingered touch: rotate

								if (scope.noRotate === true) return;

								state = STATE.TOUCH_ROTATE;

								rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
								break;

						case 2:
								// two-fingered touch: dolly

								if (scope.noZoom === true) return;

								state = STATE.TOUCH_DOLLY;

								var dx = event.touches[0].pageX - event.touches[1].pageX;
								var dy = event.touches[0].pageY - event.touches[1].pageY;
								var distance = Math.sqrt(dx * dx + dy * dy);
								dollyStart.set(0, distance);
								break;

						case 3:
								// three-fingered touch: pan

								if (scope.noPan === true) return;

								state = STATE.TOUCH_PAN;

								panStart.set(event.touches[0].pageX, event.touches[0].pageY);
								break;

						default:

								state = STATE.NONE;

				}

				if (state !== STATE.NONE) scope.dispatchEvent(startEvent);
		}

		function touchmove(event) {

				if (scope.enabled === false) return;

				event.preventDefault();
				event.stopPropagation();

				var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

				switch (event.touches.length) {

						case 1:
								// one-fingered touch: rotate

								if (scope.noRotate === true) return;
								if (state !== STATE.TOUCH_ROTATE) return;

								rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
								rotateDelta.subVectors(rotateEnd, rotateStart);

								// rotating across whole screen goes 360 degrees around
								scope.rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed);
								// rotating up and down along whole screen attempts to go 360, but limited to 180
								scope.rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed);

								rotateStart.copy(rotateEnd);

								scope.update();
								break;

						case 2:
								// two-fingered touch: dolly

								if (scope.noZoom === true) return;
								if (state !== STATE.TOUCH_DOLLY) return;

								var dx = event.touches[0].pageX - event.touches[1].pageX;
								var dy = event.touches[0].pageY - event.touches[1].pageY;
								var distance = Math.sqrt(dx * dx + dy * dy);

								dollyEnd.set(0, distance);
								dollyDelta.subVectors(dollyEnd, dollyStart);

								if (dollyDelta.y > 0) {

										scope.dollyOut();
								} else if (dollyDelta.y < 0) {

										scope.dollyIn();
								}

								dollyStart.copy(dollyEnd);

								scope.update();
								break;

						case 3:
								// three-fingered touch: pan

								if (scope.noPan === true) return;
								if (state !== STATE.TOUCH_PAN) return;

								panEnd.set(event.touches[0].pageX, event.touches[0].pageY);
								panDelta.subVectors(panEnd, panStart);

								scope.pan(panDelta.x, panDelta.y);

								panStart.copy(panEnd);

								scope.update();
								break;

						default:

								state = STATE.NONE;

				}
		}

		function touchend() /* event */{

				if (scope.enabled === false) return;

				scope.dispatchEvent(endEvent);
				state = STATE.NONE;
		}

		this.domElement.addEventListener('contextmenu', function (event) {
				event.preventDefault();
		}, false);
		this.domElement.addEventListener('mousedown', onMouseDown, false);
		this.domElement.addEventListener('mousewheel', onMouseWheel, false);
		this.domElement.addEventListener('DOMMouseScroll', onMouseWheel, false); // firefox

		this.domElement.addEventListener('touchstart', touchstart, false);
		this.domElement.addEventListener('touchend', touchend, false);
		this.domElement.addEventListener('touchmove', touchmove, false);

		window.addEventListener('keydown', onKeyDown, false);

		// force an update at start
		this.update();
};

THREE.OrbitControls.prototype = Object.create(THREE.EventDispatcher.prototype);
THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;

},{}],88:[function(require,module,exports){
/**
 * Based on https://github.com/mrdoob/three.js/blob/a72347515fa34e892f7a9bfa66a34fdc0df55954/examples/js/exporters/STLExporter.js
 * Tested on r68 and r70
 * @author jcarletto / https://github.com/jcarletto27
 * @author kjlubick / https://github.com/kjlubick
 * @author kovacsv / http://kovacsv.hu/
 * @author mrdoob / http://mrdoob.com/

 */
'use strict';

THREE.STLExporter = function () {};

THREE.STLExporter.prototype = {

	constructor: THREE.STLExporter,

	parse: (function () {

		var vector = new THREE.Vector3();
		var normalMatrixWorld = new THREE.Matrix3();

		return function (scene) {

			var output = '';

			output += 'solid exported\n';

			scene.traverse(function (object) {

				if (object instanceof THREE.Mesh) {

					var geometry = object.geometry;
					var matrixWorld = object.matrixWorld;
					var mesh = object;

					if (geometry instanceof THREE.Geometry) {

						var vertices = geometry.vertices;
						var faces = geometry.faces;

						normalMatrixWorld.getNormalMatrix(matrixWorld);

						for (var i = 0, l = faces.length; i < l; i++) {
							var face = faces[i];

							vector.copy(face.normal).applyMatrix3(normalMatrixWorld).normalize();

							output += '\tfacet normal ' + vector.x + ' ' + vector.y + ' ' + vector.z + '\n';
							output += '\t\touter loop\n';

							var indices = [face.a, face.b, face.c];

							for (var j = 0; j < 3; j++) {
								var vertexIndex = indices[j];
								if (mesh.geometry.skinIndices.length == 0) {
									vector.copy(vertices[vertexIndex]).applyMatrix4(matrixWorld);
									output += '\t\t\tvertex ' + vector.x + ' ' + vector.y + ' ' + vector.z + '\n';
								} else {
									vector.copy(vertices[vertexIndex]); //.applyMatrix4( matrixWorld );

									// see https://github.com/mrdoob/three.js/issues/3187
									boneIndices = [];
									boneIndices[0] = mesh.geometry.skinIndices[vertexIndex].x;
									boneIndices[1] = mesh.geometry.skinIndices[vertexIndex].y;
									boneIndices[2] = mesh.geometry.skinIndices[vertexIndex].z;
									boneIndices[3] = mesh.geometry.skinIndices[vertexIndex].w;

									weights = [];
									weights[0] = mesh.geometry.skinWeights[vertexIndex].x;
									weights[1] = mesh.geometry.skinWeights[vertexIndex].y;
									weights[2] = mesh.geometry.skinWeights[vertexIndex].z;
									weights[3] = mesh.geometry.skinWeights[vertexIndex].w;

									inverses = [];
									inverses[0] = mesh.skeleton.boneInverses[boneIndices[0]];
									inverses[1] = mesh.skeleton.boneInverses[boneIndices[1]];
									inverses[2] = mesh.skeleton.boneInverses[boneIndices[2]];
									inverses[3] = mesh.skeleton.boneInverses[boneIndices[3]];

									skinMatrices = [];
									skinMatrices[0] = mesh.skeleton.bones[boneIndices[0]].matrixWorld;
									skinMatrices[1] = mesh.skeleton.bones[boneIndices[1]].matrixWorld;
									skinMatrices[2] = mesh.skeleton.bones[boneIndices[2]].matrixWorld;
									skinMatrices[3] = mesh.skeleton.bones[boneIndices[3]].matrixWorld;

									//this checks to see if the mesh has any morphTargets - jc
									if (mesh.geometry.morphTargets !== 'undefined') {

										morphMatricesX = [];
										morphMatricesY = [];
										morphMatricesZ = [];
										morphMatricesInfluence = [];

										for (var mt = 0; mt < mesh.geometry.morphTargets.length; mt++) {
											//collect the needed vertex info - jc
											morphMatricesX[mt] = mesh.geometry.morphTargets[mt].vertices[vertexIndex].x;
											morphMatricesY[mt] = mesh.geometry.morphTargets[mt].vertices[vertexIndex].y;
											morphMatricesZ[mt] = mesh.geometry.morphTargets[mt].vertices[vertexIndex].z;
											morphMatricesInfluence[mt] = mesh.morphTargetInfluences[mt];
										}
									}
									var finalVector = new THREE.Vector4();

									if (mesh.geometry.morphTargets !== 'undefined') {

										var morphVector = new THREE.Vector4(vector.x, vector.y, vector.z);

										for (var mt = 0; mt < mesh.geometry.morphTargets.length; mt++) {
											//not pretty, but it gets the job done - jc
											morphVector.lerp(new THREE.Vector4(morphMatricesX[mt], morphMatricesY[mt], morphMatricesZ[mt], 1), morphMatricesInfluence[mt]);
										}
									}

									for (var k = 0; k < 4; k++) {
										if (mesh.geometry.morphTargets !== 'undefined') {
											var tempVector = new THREE.Vector4(morphVector.x, morphVector.y, morphVector.z);
										} else {
											var tempVector = new THREE.Vector4(vector.x, vector.y, vector.z);
										}
										tempVector.multiplyScalar(weights[k]);
										//the inverse takes the vector into local bone space
										//which is then transformed to the appropriate world space
										tempVector.applyMatrix4(inverses[k]).applyMatrix4(skinMatrices[k]);
										finalVector.add(tempVector);
									}

									output += '\t\t\tvertex ' + finalVector.x + ' ' + finalVector.y + ' ' + finalVector.z + '\n';
								}
							}
							output += '\t\tendloop\n';
							output += '\tendfacet\n';
						}
					}
				}
			});

			output += 'endsolid exported\n';

			return output;
		};
	})()
};

function getSTLString(scene) {
	var exporter = new THREE.STLExporter();
	var stlString = exporter.parse(scene);
	return stlString;
}

function saveSTL(scene, name) {
	var exporter = new THREE.STLExporter();
	var stlString = exporter.parse(scene);

	var blob = new Blob([stlString], {
		type: 'text/plain'
	});

	saveAs(blob, name + '.stl');
}
var exporter = new THREE.STLExporter();
var exportString = function exportString(output, filename) {

	var blob = new Blob([output], {
		type: 'text/plain'
	});
	var objectURL = URL.createObjectURL(blob);

	var link = document.createElement('a');
	link.href = objectURL;
	link.download = filename || 'data.json';
	link.target = '_blank';
	link.click();
};

module.exports.saveSTL = saveSTL;
module.exports.exportString = exportString;
module.exports.getSTLString = getSTLString;

},{}],89:[function(require,module,exports){
"use strict";

function mergeGeometries(geometries) {
	var merged = new THREE.Geometry();
	for (var i = 0; i < geometries.length; i++) {
		merged.merge(geometries[i]);
	}
	return merged;
}

module.exports.mergeGeometries = mergeGeometries;

},{}],90:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Registry = require("../../core/registry");

var MouseTool = (function () {
    function MouseTool() {
        _classCallCheck(this, MouseTool);

        this.up = MouseTool.defaultFunction("up");
        this.down = MouseTool.defaultFunction("down");
        this.move = MouseTool.defaultFunction("move");
    }

    _createClass(MouseTool, null, [{
        key: "defaultFunction",
        value: function defaultFunction(string) {
            return function () {
                console.log("No " + string + " function set.");
            };
        }
    }, {
        key: "getEventPosition",
        value: function getEventPosition(event) {
            return Registry.viewManager.getEventPosition(event);
        }
    }]);

    return MouseTool;
})();

module.exports = MouseTool;

},{"../../core/registry":57}],91:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Registry = require("../../core/registry");
var MouseTool = require("./mouseTool");
var SimpleQueue = require("../../utils/simpleQueue");
var Feature = require("../../core/feature");
var PageSetup = require("../pageSetup");

var ChannelTool = (function (_MouseTool) {
	_inherits(ChannelTool, _MouseTool);

	function ChannelTool(typeString, setString) {
		_classCallCheck(this, ChannelTool);

		_get(Object.getPrototypeOf(ChannelTool.prototype), "constructor", this).call(this);
		this.typeString = typeString;
		this.setString = setString;
		this.startPoint = null;
		this.lastPoint = null;
		this.currentChannelID = null;
		this.currentTarget = null;
		this.dragging = false;
		var ref = this;

		this.showQueue = new SimpleQueue(function () {
			ref.showTarget();
		}, 20, false);

		this.updateQueue = new SimpleQueue(function () {
			ref.updateChannel();
		}, 20, false);

		this.down = function (event) {
			PageSetup.killParamsWindow();
			paper.project.deselectAll();
			ref.dragging = true;
			ref.initChannel();
		};
		this.up = function (event) {
			ref.dragging = false;
			ref.finishChannel(MouseTool.getEventPosition(event));
		};
		this.move = function (event) {
			ref.lastPoint = MouseTool.getEventPosition(event);
			if (ref.dragging) {
				ref.updateQueue.run();
			}
			ref.showQueue.run();
		};
	}

	_createClass(ChannelTool, [{
		key: "abort",
		value: function abort() {
			ref.dragging = false;
			if (this.currentTarget) {
				this.currentTarget.remove();
			}
			if (this.currentChannelID) {
				Registry.currentLayer.removeFeatureByID(this.currentChannelID);
			}
		}
	}, {
		key: "showTarget",
		value: function showTarget(point) {
			var target = ChannelTool.getTarget(this.lastPoint);
			Registry.viewManager.updateTarget(this.typeString, this.setString, target);
		}
	}, {
		key: "initChannel",
		value: function initChannel() {
			this.startPoint = ChannelTool.getTarget(this.lastPoint);
			this.lastPoint = this.startPoint;
		}
	}, {
		key: "updateChannel",
		value: function updateChannel() {
			if (this.lastPoint && this.startPoint) {
				if (this.currentChannelID) {
					var target = ChannelTool.getTarget(this.lastPoint);
					var feat = Registry.currentLayer.getFeature(this.currentChannelID);
					feat.updateParameter("end", target);
				} else {
					// var newChannel = this.createChannel(this.startPoint, this.startPoint);
					// this.currentChannelID = newChannel.getID();
					// Registry.currentLayer.addFeature(newChannel);
				}
			}
		}
	}, {
		key: "finishChannel",
		value: function finishChannel(point) {
			var target = ChannelTool.getTarget(point);
			if (this.currentChannelID) {
				if (this.startPoint.x == target[0] && this.startPoint.y == target[1]) {
					Registry.currentLayer.removeFeatureByID(this.currentChannelID);
				}
			} else {
				this.updateChannel(point);
			}
			this.currentChannelID = null;
			this.startPoint = null;
		}
	}, {
		key: "createChannel",
		value: function createChannel(start, end) {
			return Feature.makeFeature(this.typeString, this.setString, {
				start: start,
				end: end
			});
		}

		//TODO: Re-establish target selection logic from earlier demo
	}], [{
		key: "makeReticle",
		value: function makeReticle(point) {
			var size = 10 / paper.view.zoom;
			var ret = paper.Path.Circle(point, size);
			ret.fillColor = new paper.Color(.5, 0, 1, .5);
			return ret;
		}
	}, {
		key: "getTarget",
		value: function getTarget(point) {
			var target = Registry.viewManager.snapToGrid(point);
			return [target.x, target.y];
		}
	}]);

	return ChannelTool;
})(MouseTool);

module.exports = ChannelTool;

},{"../../core/feature":47,"../../core/registry":57,"../../utils/simpleQueue":69,"../pageSetup":74,"./mouseTool":92}],92:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Registry = require("../../core/registry");

var MouseTool = (function () {
    function MouseTool() {
        _classCallCheck(this, MouseTool);

        this.up = MouseTool.defaultFunction("up");
        this.down = MouseTool.defaultFunction("down");
        this.move = MouseTool.defaultFunction("move");
    }

    _createClass(MouseTool, null, [{
        key: "defaultFunction",
        value: function defaultFunction(string) {
            return function () {
                console.log("No " + string + " function set.");
            };
        }
    }, {
        key: "getEventPosition",
        value: function getEventPosition(event) {
            return Registry.viewManager.getEventPosition(event);
        }
    }]);

    return MouseTool;
})();

module.exports = MouseTool;

},{"../../core/registry":57}],93:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Registry = require("../../core/registry");
var MouseTool = require("./mouseTool");
var SimpleQueue = require("../../utils/simpleQueue");

var PanTool = (function (_MouseTool) {
    _inherits(PanTool, _MouseTool);

    function PanTool() {
        _classCallCheck(this, PanTool);

        _get(Object.getPrototypeOf(PanTool.prototype), "constructor", this).call(this);
        this.startPoint = null;
        this.lastPoint = null;
        this.startCenter = null;
        var ref = this;
        this.updateQueue = new SimpleQueue(function () {
            ref.pan();
        }, 10);
        this.down = function (event) {
            ref.startPan(MouseTool.getEventPosition(event));
            ref.showTarget();
        };
        this.up = function (event) {
            ref.endPan(MouseTool.getEventPosition(event));
            ref.showTarget();
        };
        this.move = function (event) {
            ref.moveHandler(MouseTool.getEventPosition(event));
            ref.showTarget();
        };
    }

    _createClass(PanTool, [{
        key: "startPan",
        value: function startPan(point) {
            this.dragging = true;
            this.startPoint = point;
        }
    }, {
        key: "moveHandler",
        value: function moveHandler(point) {
            if (this.dragging) {
                this.lastPoint = point;
                this.updateQueue.run();
                // this.pan();
            }
        }
    }, {
        key: "endPan",
        value: function endPan(point) {
            this.pan();
            this.lastPoint = null;
            this.dragging = false;
            this.startPoint = null;
        }
    }, {
        key: "showTarget",
        value: function showTarget() {
            Registry.viewManager.removeTarget();
        }
    }, {
        key: "pan",
        value: function pan() {
            if (this.lastPoint) {
                var delta = this.lastPoint.subtract(this.startPoint);
                Registry.viewManager.moveCenter([delta.x, delta.y]);
            }
        }
    }]);

    return PanTool;
})(MouseTool);

module.exports = PanTool;

},{"../../core/registry":57,"../../utils/simpleQueue":69,"./mouseTool":92}],94:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MouseTool = require("./mouseTool");
var Registry = require("../../core/registry");
var Feature = require("../../core/feature");
var SimpleQueue = require("../../utils/simpleQueue");
var PageSetup = require("../pageSetup");

var PositionTool = (function (_MouseTool) {
    _inherits(PositionTool, _MouseTool);

    function PositionTool(typeString, setString) {
        _classCallCheck(this, PositionTool);

        _get(Object.getPrototypeOf(PositionTool.prototype), "constructor", this).call(this);
        this.typeString = typeString;
        this.setString = setString;
        this.currentFeatureID = null;
        var ref = this;
        this.lastPoint = null;
        this.showQueue = new SimpleQueue(function () {
            ref.showTarget();
        }, 20, false);
        this.up = function (event) {
            // do nothing
        };
        this.move = function (event) {
            ref.lastPoint = MouseTool.getEventPosition(event);
            ref.showQueue.run();
        };
        this.down = function (event) {
            PageSetup.killParamsWindow();
            paper.project.deselectAll();
            ref.createNewFeature(MouseTool.getEventPosition(event));
        };
    }

    _createClass(PositionTool, [{
        key: "createNewFeature",
        value: function createNewFeature(point) {
            var newFeature = Feature.makeFeature(this.typeString, this.setString, {
                "position": PositionTool.getTarget(point)
            });
            this.currentFeatureID = newFeature.getID();
            Registry.currentLayer.addFeature(newFeature);
        }
    }, {
        key: "showTarget",
        value: function showTarget() {
            var target = PositionTool.getTarget(this.lastPoint);
            Registry.viewManager.updateTarget(this.typeString, this.setString, target);
        }
    }], [{
        key: "getTarget",
        value: function getTarget(point) {
            var target = Registry.viewManager.snapToGrid(point);
            return [target.x, target.y];
        }
    }]);

    return PositionTool;
})(MouseTool);

module.exports = PositionTool;

},{"../../core/feature":47,"../../core/registry":57,"../../utils/simpleQueue":69,"../pageSetup":74,"./mouseTool":92}],95:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Registry = require("../../core/registry");
var MouseTool = require("./MouseTool");
var SimpleQueue = require("../../utils/simpleQueue");
var PageSetup = require("../pageSetup");

var SelectTool = (function (_MouseTool) {
	_inherits(SelectTool, _MouseTool);

	function SelectTool() {
		_classCallCheck(this, SelectTool);

		_get(Object.getPrototypeOf(SelectTool.prototype), "constructor", this).call(this);
		this.dragging = false;
		this.dragStart = null;
		this.lastPoint = null;
		this.currentSelectBox = null;
		this.currentSelection = [];
		var ref = this;
		this.updateQueue = new SimpleQueue(function () {
			ref.dragHandler();
		}, 20);
		this.down = function (event) {
			PageSetup.killParamsWindow();
			ref.mouseDownHandler(event);
			ref.dragging = true;
			ref.showTarget();
		};
		this.move = function (event) {
			if (ref.dragging) {
				ref.lastPoint = MouseTool.getEventPosition(event);
				ref.updateQueue.run();
			}
			ref.showTarget();
		};
		this.up = function (event) {
			ref.dragging = false;
			ref.mouseUpHandler(MouseTool.getEventPosition(event));
			ref.showTarget();
		};
	}

	_createClass(SelectTool, [{
		key: "keyHandler",
		value: function keyHandler(event) {
			if (event.key == "delete" || event.key == "backspace") {
				this.removeFeatures();
			}
		}
	}, {
		key: "dragHandler",
		value: function dragHandler() {
			if (this.dragStart) {
				if (this.currentSelectBox) {
					this.currentSelectBox.remove();
				}
				this.currentSelectBox = this.rectSelect(this.dragStart, this.lastPoint);
			}
		}
	}, {
		key: "showTarget",
		value: function showTarget() {
			Registry.viewManager.removeTarget();
		}
	}, {
		key: "mouseUpHandler",
		value: function mouseUpHandler(point) {
			if (this.currentSelectBox) {
				this.currentSelection = Registry.viewManager.hitFeaturesWithViewElement(this.currentSelectBox);
				this.selectFeatures();
                // console.log(this); // --> THIS == SelectTool
                // console.log("Bebí");
                // console.log(Registry.currentDevice.getLayerFromFeatureID(featureID));
                console.log(this.currentSelection);
			}
			this.killSelectBox();
		}
	}, {
		key: "removeFeatures",
		value: function removeFeatures() {
			if (this.currentSelection.length > 0) {
				for (var i = 0; i < this.currentSelection.length; i++) {
					var paperFeature = this.currentSelection[i];
					Registry.currentDevice.removeFeatureByID(paperFeature.featureID);
				}
				this.currentSelection = [];
				Registry.canvasManager.render();
			}
		}
	}, {
		key: "mouseDownHandler",
		value: function mouseDownHandler(event) {
			var point = MouseTool.getEventPosition(event);
			var target = this.hitFeature(point);
			if (target) {
				if (target.selected) {
					var feat = Registry.currentDevice.getFeatureByID(target.featureID);
					Registry.viewManager.updateDefaultsFromFeature(feat);
					var func = PageSetup.paramsWindowFunction(feat.getType(), feat.getSet());
					func(event);
				} else {
					this.deselectFeatures();
					this.selectFeature(target);
				}
			} else {
				this.deselectFeatures();
				this.dragStart = point;
			}
		}
	}, {
		key: "killSelectBox",
		value: function killSelectBox() {
			if (this.currentSelectBox) {
				this.currentSelectBox.remove();
				this.currentSelectBox = null;
			}
			this.dragStart = null;
		}
	}, {
		key: "hitFeature",
		value: function hitFeature(point) {
			var target = Registry.viewManager.hitFeature(point);
			return target;
		}
	}, {
		key: "selectFeature",
		value: function selectFeature(paperElement) {
			this.currentSelection.push(paperElement);
			paperElement.selected = true;
		}
	}, {
		key: "selectFeatures",
		value: function selectFeatures() {
			if (this.currentSelection) {
				for (var i = 0; i < this.currentSelection.length; i++) {
					var paperFeature = this.currentSelection[i];
					paperFeature.selected = true;
				}
			}
		}
	}, {
		key: "deselectFeatures",
		value: function deselectFeatures() {
			paper.project.deselectAll();
			this.currentSelection = [];
		}
	}, {
		key: "abort",
		value: function abort() {
			this.deselectFeatures();
			this.killSelectBox();
		}
	}, {
		key: "rectSelect",
		value: function rectSelect(point1, point2) {
			var rect = new paper.Path.Rectangle(point1, point2);
			rect.fillColor = new paper.Color(0, .3, 1, .4);
			rect.strokeColor = new paper.Color(0, 0, 0);
			rect.strokeWidth = 2;
			rect.selected = true;
			return rect;
		}
	}]);

	return SelectTool;
})(MouseTool);

module.exports = SelectTool;

},{"../../core/registry":57,"../../utils/simpleQueue":69,"../pageSetup":74,"./MouseTool":90}],96:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Registry = require("../core/registry");
var Device = require("../core/device");
var ChannelTool = require("./tools/channelTool");
var MouseTool = require("./tools/mouseTool");
var PanTool = require("./tools/panTool");
var PanAndZoom = require("./PanAndZoom");
var SelectTool = require("./tools/selectTool");
var SimpleQueue = require("../utils/SimpleQueue");
var PositionTool = require("./tools/positionTool");

var ViewManager = (function () {
    function ViewManager(view) {
        _classCallCheck(this, ViewManager);

        this.view = view;
        this.tools = {};
        this.middleMouseTool = new PanTool();
        this.rightMouseTool = new SelectTool();
        var reference = this;
        this.updateQueue = new SimpleQueue(function () {
            reference.view.refresh();
        }, 20);
        this.saveQueue = new SimpleQueue(function () {
            reference.saveToStorage();
        });
        window.onkeydown = function (event) {
            var key = event.keyCode || event.which;
            if (key == 46) {
                event.preventDefault();
            }
        };
        this.view.setKeyDownFunction(function (event) {
            var key = event.keyCode || event.which;
            if (key == 46 || key == 8) {
                reference.view.deleteSelectedFeatures();
            }
        });

        this.view.setResizeFunction(function () {
            reference.updateGrid();
            reference.updateDevice(Registry.currentDevice);
        });

        var func = function func(event) {
            reference.adjustZoom(event.deltaY, reference.getEventPosition(event));
        };
        this.view.setMouseWheelFunction(func);
        this.minZoom = .0001;
        this.maxZoom = 5;
        this.setupTools();
        this.activateTool("Channel");
    }

    _createClass(ViewManager, [{
        key: "addDevice",
        value: function addDevice(device) {
            var refresh = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

            this.view.addDevice(device);
            this.__addAllDeviceLayers(device, false);
            this.refresh(refresh);
        }
    }, {
        key: "__addAllDeviceLayers",
        value: function __addAllDeviceLayers(device) {
            var refresh = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

            for (var i = 0; i < device.layers.length; i++) {
                var layer = device.layers[i];
                this.addLayer(layer, i, false);
            }
        }
    }, {
        key: "__removeAllDeviceLayers",
        value: function __removeAllDeviceLayers(device) {
            var refresh = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

            for (var i = 0; i < device.layers.length; i++) {
                var layer = device.layers[i];
                this.removeLayer(layer, i, false);
            }
        }
    }, {
        key: "removeDevice",
        value: function removeDevice(device) {
            var refresh = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

            this.view.removeDevice(device);
            this.__removeAllDeviceLayers(device, false);
            this.refresh(refresh);
        }
    }, {
        key: "updateDevice",
        value: function updateDevice(device) {
            var refresh = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

            this.view.updateDevice(device);
            this.refresh(refresh);
        }
    }, {
        key: "addFeature",
        value: function addFeature(feature) {
            var refresh = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

            if (this.__isFeatureInCurrentDevice(feature)) {
                this.view.addFeature(feature);
                this.refresh(refresh);
            }
        }
    }, {
        key: "updateFeature",
        value: function updateFeature(feature) {
            var refresh = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

            if (this.__isFeatureInCurrentDevice(feature)) {
                this.view.updateFeature(feature);
                this.refresh(refresh);
            }
        }
    }, {
        key: "removeFeature",
        value: function removeFeature(feature) {
            var refresh = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

            if (this.__isFeatureInCurrentDevice(feature)) {
                this.view.removeFeature(feature);
                this.refresh(refresh);
            }
        }
    }, {
        key: "addLayer",
        value: function addLayer(layer, index) {
            var refresh = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

            if (this.__isLayerInCurrentDevice(layer)) {
                this.view.addLayer(layer, index, false);
                this.__addAllLayerFeatures(layer, false);
                this.refresh(refresh);
            }
        }
    }, {
        key: "updateLayer",
        value: function updateLayer(layer, index) {
            var refresh = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

            if (this.__isLayerInCurrentDevice(layer)) {
                this.view.updateLayer(layer);
                this.refresh(refresh);
            }
        }
    }, {
        key: "removeLayer",
        value: function removeLayer(layer, index) {
            var refresh = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

            if (this.__isLayerInCurrentDevice(layer)) {
                this.view.removeLayer(layer, index);
                this.__removeAllLayerFeatures(layer);
                this.refresh(refresh);
            }
        }
    }, {
        key: "layersToSVGStrings",
        value: function layersToSVGStrings() {
            return this.view.layersToSVGStrings();
        }
    }, {
        key: "__addAllLayerFeatures",
        value: function __addAllLayerFeatures(layer) {
            var refresh = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

            for (var key in layer.features) {
                var feature = layer.features[key];
                this.addFeature(feature, false);
                this.refresh(refresh);
            }
        }
    }, {
        key: "__updateAllLayerFeatures",
        value: function __updateAllLayerFeatures(layer) {
            var refresh = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

            for (var key in layer.features) {
                var feature = layer.features[key];
                this.updateFeature(feature, false);
                this.refresh(refresh);
            }
        }
    }, {
        key: "__removeAllLayerFeatures",
        value: function __removeAllLayerFeatures(layer) {
            var refresh = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

            for (var key in layer.features) {
                var feature = layer.features[key];
                this.removeFeature(feature, false);
                this.refresh(refresh);
            }
        }
    }, {
        key: "updateLayer",
        value: function updateLayer(layer) {
            var refresh = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

            if (this.__isLayerInCurrentDevice(layer)) {
                this.view.updateLayer(layer);
                this.refresh(refresh);
            }
        }
    }, {
        key: "updateActiveLayer",
        value: function updateActiveLayer() {
            var refresh = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

            this.view.setActiveLayer(Registry.currentDevice.layers.indexOf(Registry.currentLayer));
            this.refresh(refresh);
        }
    }, {
        key: "removeGrid",
        value: function removeGrid() {
            var refresh = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

            if (this.__hasCurrentGrid()) {
                this.view.removeGrid();
                this.refresh(refresh);
            }
        }
    }, {
        key: "updateGrid",
        value: function updateGrid() {
            var refresh = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

            if (this.__hasCurrentGrid()) {
                this.view.updateGrid(Registry.currentGrid);
                this.refresh(refresh);
            }
        }
    }, {
        key: "clear",
        value: function clear() {
            this.view.clear();
        }
    }, {
        key: "setZoom",
        value: function setZoom(zoom) {
            var refresh = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

            if (zoom > this.maxZoom) zoom = this.maxZoom;else if (zoom < this.minZoom) zoom = this.minZoom;
            this.view.setZoom(zoom);
            this.updateGrid(false);
            this.updateDevice(Registry.currentDevice, false);
            this.__updateViewTarget(false);
            this.refresh(refresh);
        }
    }, {
        key: "removeTarget",
        value: function removeTarget() {
            this.view.removeTarget();
        }
    }, {
        key: "updateTarget",
        value: function updateTarget(featureType, featureSet, position) {
            var refresh = arguments.length <= 3 || arguments[3] === undefined ? true : arguments[3];

            this.view.addTarget(featureType, featureSet, position);
            this.refresh(refresh);
        }
    }, {
        key: "__updateViewTarget",
        value: function __updateViewTarget() {
            var refresh = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

            this.view.updateTarget();
            this.refresh(refresh);
        }
    }, {
        key: "adjustZoom",
        value: function adjustZoom(delta, point) {
            var refresh = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

            var belowMin = this.view.getZoom() >= this.maxZoom && delta < 0;
            var aboveMax = this.view.getZoom() <= this.minZoom && delta > 0;
            if (!aboveMax && !belowMin) {
                this.view.adjustZoom(delta, point);
                this.updateGrid(false);
                this.updateDevice(Registry.currentDevice, false);
                this.__updateViewTarget(false);
            } else {
                //console.log("Too big or too small!");
            }
            this.refresh(refresh);
        }
    }, {
        key: "setCenter",
        value: function setCenter(center) {
            var refresh = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

            this.view.setCenter(center);
            this.updateGrid(false);
            this.updateDevice(Registry.currentDevice, false);
            this.refresh(refresh);
        }
    }, {
        key: "moveCenter",
        value: function moveCenter(delta) {
            var refresh = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

            this.view.moveCenter(delta);
            this.updateGrid(false);
            this.updateDevice(Registry.currentDevice, false);
            this.refresh(refresh);
        }
    }, {
        key: "saveToStorage",
        value: function saveToStorage() {
            if (Registry.currentDevice) {
                try {
                    localStorage.setItem('currentDevice', JSON.stringify(Registry.currentDevice.toJSON()));
                } catch (err) {
                    // can't save, so.. don't?
                }
            }
        }
    }, {
        key: "refresh",
        value: function refresh() {
            var _refresh = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

            this.updateQueue.run();
        }
    }, {
        key: "getEventPosition",
        value: function getEventPosition(event) {
            return this.view.getProjectPosition(event.clientX, event.clientY);
        }
    }, {
        key: "__hasCurrentGrid",
        value: function __hasCurrentGrid() {
            if (Registry.currentGrid) return true;else return false;
        }
    }, {
        key: "__isLayerInCurrentDevice",
        value: function __isLayerInCurrentDevice(layer) {
            if (Registry.currentDevice && layer.device == Registry.currentDevice) return true;else return false;
        }
    }, {
        key: "__isFeatureInCurrentDevice",
        value: function __isFeatureInCurrentDevice(feature) {
            if (Registry.currentDevice && this.__isLayerInCurrentDevice(feature.layer)) return true;else return false;
        }
    }, {
        key: "constructMouseDownEvent",
        value: function constructMouseDownEvent(tool1, tool2, tool3) {
            return this.constructMouseEvent(tool1.down, tool2.down, tool3.down);
        }
    }, {
        key: "constructMouseMoveEvent",
        value: function constructMouseMoveEvent(tool1, tool2, tool3) {
            return this.constructMouseEvent(tool1.move, tool2.move, tool3.move);
        }
    }, {
        key: "constructMouseUpEvent",
        value: function constructMouseUpEvent(tool1, tool2, tool3) {
            return this.constructMouseEvent(tool1.up, tool2.up, tool3.up);
        }
    }, {
        key: "loadDeviceFromJSON",
        value: function loadDeviceFromJSON(json) {
            Registry.viewManager.clear();
            Registry.currentDevice = Device.fromJSON(json);
            Registry.currentLayer = Registry.currentDevice.layers[0];
            Registry.viewManager.addDevice(Registry.currentDevice);
            this.view.initializeView();
            this.updateGrid();
            this.updateDevice(Registry.currentDevice);
            this.refresh(true);
        }
    }, {
        key: "removeFeaturesByPaperElements",
        value: function removeFeaturesByPaperElements(paperElements) {
            if (paperElements.length > 0) {
                for (var i = 0; i < paperElements.length; i++) {
                    var paperFeature = paperElements[i];
                    Registry.currentDevice.removeFeatureByID(paperFeature.featureID);
                }
                this.currentSelection = [];
            }
        }
    }, {
        key: "constructMouseEvent",
        value: function constructMouseEvent(func1, func2, func3) {
            return function (event) {
                var target = undefined;
                if (event.buttons) {
                    target = ViewManager.__eventButtonsToWhich(event.buttons);
                } else {
                    target = event.which;
                }
                if (target == 2) func2(event);else if (target == 3) func3(event);else if (target == 1 || target == 0) func1(event);
            };
        }
    }, {
        key: "snapToGrid",
        value: function snapToGrid(point) {
            if (Registry.currentGrid) return Registry.currentGrid.getClosestGridPoint(point);else return point;
        }
    }, {
        key: "getFeaturesOfType",
        value: function getFeaturesOfType(typeString, setString, features) {
            var output = [];
            for (var i = 0; i < features.length; i++) {
                var feature = features[i];
                if (feature.getType() == typeString && feature.getSet() == setString) {
                    output.push(feature);
                }
            }
            return output;
        }
    }, {
        key: "adjustAllFeatureParams",
        value: function adjustAllFeatureParams(valueString, value, features) {
            for (var i = 0; i < features.length; i++) {
                var feature = features[i];
                feature.updateParameter(valueString, value);
            }
        }
    }, {
        key: "adjustParams",
        value: function adjustParams(typeString, setString, valueString, value) {
            var selectedFeatures = this.view.getSelectedFeatures();
            if (selectedFeatures.length > 0) {
                var correctType = this.getFeaturesOfType(typeString, setString, selectedFeatures);
                if (correctType.length > 0) {
                    this.adjustAllFeatureParams(valueString, value, correctType);
                }
            }
            this.updateDefault(typeString, setString, valueString, value);
        }
    }, {
        key: "updateDefault",
        value: function updateDefault(typeString, setString, valueString, value) {
            Registry.featureDefaults[setString][typeString][valueString] = value;
        }
    }, {
        key: "updateDefaultsFromFeature",
        value: function updateDefaultsFromFeature(feature) {
            var heritable = feature.getHeritableParams();
            for (var key in heritable) {
                this.updateDefault(feature.getType(), feature.getSet(), key, feature.getValue(key));
            }
        }
    }, {
        key: "hitFeature",
        value: function hitFeature(point) {
            return this.view.hitFeature(point);
        }
    }, {
        key: "hitFeaturesWithViewElement",
        value: function hitFeaturesWithViewElement(element) {
            return this.view.hitFeaturesWithViewElement(element);
        }
    }, {
        key: "__updateViewMouseEvents",
        value: function __updateViewMouseEvents() {
            this.view.setMouseDownFunction(this.constructMouseDownEvent(this.leftMouseTool, this.middleMouseTool, this.rightMouseTool));
            this.view.setMouseUpFunction(this.constructMouseUpEvent(this.leftMouseTool, this.middleMouseTool, this.rightMouseTool));
            this.view.setMouseMoveFunction(this.constructMouseMoveEvent(this.leftMouseTool, this.middleMouseTool, this.rightMouseTool));
        }
    }, {
        key: "activateTool",
        value: function activateTool(toolString) {
            this.leftMouseTool = this.tools[toolString];
            this.__updateViewMouseEvents();
        }
    }, {
        key: "setupTools",
        value: function setupTools() {
            this.tools["Chamber"] = new ChannelTool("Chamber", "Basic");
            this.tools["Channel"] = new ChannelTool("Channel", "Basic");
            this.tools["CircleValve"] = new PositionTool("CircleValve", "Basic");
            this.tools["Port"] = new PositionTool("Port", "Basic");
            this.tools["Via"] = new PositionTool("Via", "Basic");
        }
    }], [{
        key: "__eventButtonsToWhich",
        value: function __eventButtonsToWhich(num) {
            if (num == 1) {
                return 1;
            } else if (num == 2) {
                return 3;
            } else if (num == 4) {
                return 2;
            } else if (num == 3) {
                return 2;
            }
        }
    }]);

    return ViewManager;
})();

module.exports = ViewManager;

},{"../core/device":46,"../core/registry":57,"../utils/SimpleQueue":66,"./PanAndZoom":70,"./tools/channelTool":91,"./tools/mouseTool":92,"./tools/panTool":93,"./tools/positionTool":94,"./tools/selectTool":95}]},{},[45]);
