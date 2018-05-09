window.ice = window.ice ? window.ice : {};
window.ice.lib = {};
ice.module = function module(definitions) {
    var context = {};
    function defineVariable(name, variable) {
        if (context[name]) {
            throw 'variable "' + name + '" already defined';
        }
        context[name] = variable;
        return variable;
    }
    definitions(defineVariable);
    return context;
};
ice.importFrom = function importFrom(moduleName) {
    var context = window;
    var atoms = moduleName.split('.');
    for (var i = 0, size = atoms.length; i < size; i++) {
        context = context[atoms[i]];
    }
    var code = [];
    for (var p in context) {
        if (context.hasOwnProperty(p)) {
            code.push('var ' + p + '=' + moduleName + '["' + p + '"]');
        }
    }
    return code.join(';')
};
ice.evaluate = eval;
ice.lib.oo = ice.module(function(exportAs) {
    function isArray(a) {
        return a && !!a.push;
    }
    function isString(s) {
        return typeof s == 'string';
    }
    function isNumber(s) {
        return typeof s == 'number';
    }
    function isBoolean(s) {
        return typeof s == 'boolean';
    }
    function isIndexed(s) {
        return typeof s.length == 'number';
    }
    function isObject(o) {
        return o.instanceTag == o;
    }
    var uid = (function() {
        var id = 0;
        return function() {
            return id++;
        };
    })();
    function operationNotSupported() {
        throw 'operation not supported';
    }
    function operator(defaultOperation) {
        return function() {
            var args = arguments;
            var instance = arguments[0];
            if (instance.instanceTag && instance.instanceTag == instance) {
                var method = instance(arguments.callee);
                if (method) {
                    return method.apply(method, args);
                } else {
                    operationNotSupported();
                }
            } else {
                return defaultOperation ? defaultOperation.apply(defaultOperation, args) : operationNotSupported();
            }
        };
    }
    var asString = operator(String);
    var asNumber = operator(Number);
    var hash = operator(function(o) {
        var s;
        if (isString(o)) {
            s = o;
        } else if (isNumber(o)) {
            return Math.abs(Math.round(o));
        } else {
            s = o.toString();
        }
        var h = 0;
        for (var i = 0, l = s.length; i < l; i++) {
            var c = parseInt(s[i], 36);
            if (!isNaN(c)) {
                h = c + (h << 6) + (h << 16) - h;
            }
        }
        return Math.abs(h);
    });
    var equal = operator(function(a, b) {
        return a == b;
    });
    function object(definition) {
        var operators = [];
        var methods = [];
        var unknown = null;
        var id = uid();
        operators.push(hash);
        methods.push(function(self) {
            return id;
        });
        operators.push(equal);
        methods.push(function(self, other) {
            return self == other;
        });
        operators.push(asString);
        methods.push(function(self) {
            return 'Object:' + id.toString(16);
        });
        definition(function(operator, method) {
            var size = operators.length;
            for (var i = 0; i < size; i++) {
                if (operators[i] == operator) {
                    methods[i] = method;
                    return;
                }
            }
            operators.push(operator);
            methods.push(method);
        }, function(method) {
            unknown = method;
        });
        function self(operator) {
            var size = operators.length;
            for (var i = 0; i < size; i++) {
                if (operators[i] == operator) {
                    return methods[i];
                }
            }
            return unknown;
        }
        return self.instanceTag = self;
    }
    function objectWithAncestors() {
        var definition = arguments[0];
        var args = arguments;
        var o = object(definition);
        function self(operator) {
            var method = o(operator);
            if (method) {
                return method;
            } else {
                var size = args.length;
                for (var i = 1; i < size; i++) {
                    var ancestor = args[i];
                    var overriddenMethod = ancestor(operator);
                    if (overriddenMethod) {
                        return overriddenMethod;
                    }
                }
                return null;
            }
        }
        return self.instanceTag = self;
    }
    exportAs('isArray', isArray);
    exportAs('isString', isString);
    exportAs('isNumber', isNumber);
    exportAs('isBoolean', isBoolean);
    exportAs('isIndexed', isIndexed);
    exportAs('isObject', isObject);
    exportAs('asString', asString);
    exportAs('asNumber', asNumber);
    exportAs('hash', hash);
    exportAs('equal', equal);
    exportAs('operationNotSupported', operationNotSupported);
    exportAs('operator', operator);
    exportAs('object', object);
    exportAs('objectWithAncestors', objectWithAncestors);
});
ice.lib.functional = ice.module(function(exportAs) {
    function apply(fun, args) {
        return fun.apply(fun, args);
    }
    function withArguments() {
        var args = arguments;
        return function(fun) {
            apply(fun, args);
        };
    }
    function curry() {
        var args = arguments;
        return function() {
            var curriedArguments = [];
            var fun = args[0];
            for (var i = 1; i < args.length; i++) curriedArguments.push(args[i]);
            for (var j = 0; j < arguments.length; j++) curriedArguments.push(arguments[j]);
            return apply(fun, curriedArguments);
        };
    }
    function $witch(tests, defaultRun) {
        return function(val) {
            var args = arguments;
            var conditions = [];
            var runs = [];
            tests(function(condition, run) {
                conditions.push(condition);
                runs.push(run);
            });
            var size = conditions.length;
            for (var i = 0; i < size; i++) {
                if (apply(conditions[i], args)) {
                    return apply(runs[i], args);
                }
            }
            if (defaultRun) apply(defaultRun, args);
        };
    }
    function identity(arg) {
        return arg;
    }
    function negate(b) {
        return !b;
    }
    function greater(a, b) {
        return a > b;
    }
    function less(a, b) {
        return a < b;
    }
    function not(a) {
        return !a;
    }
    function multiply(a, b) {
        return a * b;
    }
    function plus(a, b) {
        return a + b;
    }
    function max(a, b) {
        return a > b ? a : b;
    }
    function increment(value, step) {
        return value + (step ? step : 1);
    }
    function decrement(value, step) {
        return value - (step ? step : 1);
    }
    function any() {
        return true;
    }
    function none() {
        return false;
    }
    function noop() {
    }
    exportAs('apply', apply);
    exportAs('withArguments', withArguments);
    exportAs('curry', curry);
    exportAs('$witch', $witch);
    exportAs('identity', identity);
    exportAs('negate', negate);
    exportAs('greater', greater);
    exportAs('less', less);
    exportAs('not', not);
    exportAs('multiply', multiply);
    exportAs('plus', plus);
    exportAs('max', max);
    exportAs('increment', increment);
    exportAs('decrement', decrement);
    exportAs('any', any);
    exportAs('none', none);
    exportAs('noop', noop);
});
ice.lib.delay = ice.module(function(exportAs) {
    eval(ice.importFrom('ice.lib.oo'));
    var run = operator();
    var runOnce = operator();
    var stop = operator();
    function Delay(f, milliseconds) {
        return object(function(method) {
            var id = null;
            var canceled = false;
            method(run, function(self, times) {
                if (id || canceled) return;
                var call = times ? function() {
                    try {
                        f();
                    } finally {
                        if (--times < 1) stop(self);
                    }
                } : f;
                id = setInterval(call, milliseconds);
                return self;
            });
            method(runOnce, function(self) {
                return run(self, 1);
            });
            method(stop, function(self) {
                if (id) {
                    clearInterval(id);
                    id = null;
                } else {
                    canceled = true;
                }
            });
        });
    }
    exportAs('run', run);
    exportAs('runOnce', runOnce);
    exportAs('stop', stop);
    exportAs('Delay', Delay);
});
ice.lib.string = ice.module(function(exportAs) {
    function indexOf(s, substring) {
        var index = s.indexOf(substring);
        if (index >= 0) {
            return index;
        } else {
            throw '"' + s + '" does not contain "' + substring + '"';
        }
    }
    function lastIndexOf(s, substring) {
        var index = s.lastIndexOf(substring);
        if (index >= 0) {
            return index;
        } else {
            throw 'string "' + s + '" does not contain "' + substring + '"';
        }
    }
    function startsWith(s, pattern) {
        return s.indexOf(pattern) == 0;
    }
    function endsWith(s, pattern) {
        var position = s.lastIndexOf(pattern);
        return position > -1 && (position == s.length - pattern.length);
    }
    function containsSubstring(s, substring) {
        return s.indexOf(substring) >= 0;
    }
    function blank(s) {
        return /^\s*$/.test(s);
    }
    function split(s, separator) {
        return s.length == 0 ? [] : s.split(separator);
    }
    function replace(s, regex, replace) {
        return s.replace(regex, replace);
    }
    function toLowerCase(s) {
        return s.toLowerCase();
    }
    function toUpperCase(s) {
        return s.toUpperCase();
    }
    function substring(s, from, to) {
        return s.substring(from, to);
    }
    function trim(s) {
        s = s.replace(/^\s+/, '');
        for (var i = s.length - 1; i >= 0; i--) {
            if (/\S/.test(s.charAt(i))) {
                s = s.substring(0, i + 1);
                break;
            }
        }
        return s;
    }
    var asNumber = Number;
    function asBoolean(s) {
        return 'true' == s || 'any' == s;
    }
    function asRegexp(s) {
        return new RegExp(s);
    }
    exportAs('indexOf', indexOf);
    exportAs('lastIndexOf', lastIndexOf);
    exportAs('startsWith', startsWith);
    exportAs('endsWith', endsWith);
    exportAs('containsSubstring', containsSubstring);
    exportAs('blank', blank);
    exportAs('split', split);
    exportAs('replace', replace);
    exportAs('toLowerCase', toLowerCase);
    exportAs('toUpperCase', toUpperCase);
    exportAs('substring', substring);
    exportAs('trim', trim);
    exportAs('asNumber', asNumber);
    exportAs('asBoolean', asBoolean);
    exportAs('asRegexp', asRegexp);
});
ice.lib.collection = ice.module(function(exportAs) {
    eval(ice.importFrom('ice.lib.functional'));
    eval(ice.importFrom('ice.lib.oo'));
    var indexOf = operator($witch(function(condition) {
        condition(isString, function(items, item) {
            return items.indexOf(item);
        });
        condition(isArray, function(items, item) {
            for (var i = 0, size = items.length; i < size; i++) {
                if (items[i] == item) {
                    return i;
                }
            }
            return -1;
        });
        condition(any, operationNotSupported);
    }));
    var concatenate = operator(function(items, other) {
        return items.concat(other);
    });
    var append = operator(function(items, item) {
        if (isArray(items)) {
            items.push(item);
            return items;
        } else {
            operationNotSupported();
        }
    });
    var insert = operator($witch(function(condition) {
        condition(isArray, function(items, item) {
            items.unshift(item);
            return items;
        });
        condition(any, operationNotSupported);
    }));
    var each = operator(function(items, iterator) {
        var size = items.length;
        for (var i = 0; i < size; i++) iterator(items[i], i);
    });
    var inject = operator(function(items, initialValue, injector) {
        var tally = initialValue;
        var size = items.length;
        for (var i = 0; i < size; i++) {
            tally = injector(tally, items[i]);
        }
        return tally;
    });
    var select = operator($witch(function(condition) {
        condition(isArray, function(items, selector) {
            return inject(items, [], function(tally, item) {
                return selector(item) ? append(tally, item) : tally;
            });
        });
        condition(isString, function(items, selector) {
            return inject(items, '', function(tally, item) {
                return selector(item) ? concatenate(tally, item) : tally;
            });
        });
        condition(isIndexed, function(items, selector) {
            return Stream(function(cellConstructor) {
                function selectingStream(start, end) {
                    if (start > end) return null;
                    var item = items[start];
                    return selector(item) ?
                        function() {
                            return cellConstructor(item, selectingStream(start + 1, end));
                        } : selectingStream(start + 1, end);
                }
                return selectingStream(0, items.length - 1);
            });
        });
    }));
    var detect = operator(function(items, iterator, notDetectedThunk) {
        var size = items.length;
        for (var i = 0; i < size; i++) {
            var element = items[i];
            if (iterator(element, i)) {
                return element;
            }
        }
        return notDetectedThunk ? notDetectedThunk(items) : null;
    });
    var contains = operator($witch(function(condition) {
        condition(isString, function(items, item) {
            return items.indexOf(item) > -1;
        });
        condition(isArray, function(items, item) {
            var size = items.length;
            for (var i = 0; i < size; i++) {
                if (equal(items[i], item)) {
                    return true;
                }
            }
            return false;
        });
        condition(any, operationNotSupported);
    }));
    var size = operator(function(items) {
        return items.length;
    });
    var empty = operator(function(items) {
        items.length = 0;
    });
    var isEmpty = operator(function(items) {
        return items.length == 0;
    });
    var notEmpty = function(items) {
        return !isEmpty(items);
    };
    var collect = operator($witch(function(condition) {
        condition(isString, function(items, collector) {
            return inject(items, '', function(tally, item) {
                return concatenate(tally, collector(item));
            });
        });
        condition(isArray, function(items, collector) {
            return inject(items, [], function(tally, item) {
                return append(tally, collector(item));
            });
        });
        condition(isIndexed, function(items, collector) {
            return Stream(function(cellConstructor) {
                function collectingStream(start, end) {
                    if (start > end) return null;
                    return function() {
                        return cellConstructor(collector(items[start], start), collectingStream(start + 1, end));
                    };
                }
                return collectingStream(0, items.length - 1);
            });
        });
    }));
    var sort = operator(function(items, sorter) {
        return copy(items).sort(function(a, b) {
            return sorter(a, b) ? -1 : 1;
        });
    });
    var reverse = operator(function(items) {
        return copy(items).reverse();
    });
    var copy = operator(function(items) {
        return inject(items, [], curry(append));
    });
    var join = operator(function(items, separator) {
        return items.join(separator);
    });
    var inspect = operator();
    var reject = function(items, rejector) {
        return select(items, function(i) {
            return !rejector(i);
        });
    };
    var intersect = operator(function(items, other) {
        return select(items, curry(contains, other));
    });
    var complement = operator(function(items, other) {
        return reject(items, curry(contains, other));
    });
    var broadcast = function(items, args) {
        args = args || [];
        each(items, function(i) {
            apply(i, args);
        });
    };
    var broadcaster = function(items) {
        return function() {
            var args = arguments;
            each(items, function(i) {
                apply(i, args);
            });
        };
    };
    var asArray = function(items) {
        return inject(items, [], append);
    };
    var asSet = function(items) {
        return inject(items, [], function(set, item) {
            if (not(contains(set, item))) {
                append(set, item);
            }
            return set;
        });
    };
    var key = operator();
    var value = operator();
    function Cell(k, v) {
        return object(function(method) {
            method(key, function(self) {
                return k;
            });
            method(value, function(self) {
                return v;
            });
            method(asString, function(self) {
                return 'Cell[' + asString(k) + ': ' + asString(v) + ']';
            });
        });
    }
    function Stream(streamDefinition) {
        var stream = streamDefinition(Cell);
        return object(function(method) {
            method(each, function(self, iterator) {
                var cursor = stream;
                while (cursor != null) {
                    var cell = cursor();
                    iterator(key(cell));
                    cursor = value(cell);
                }
            });
            method(inject, function(self, initialValue, injector) {
                var tally = initialValue;
                var cursor = stream;
                while (cursor != null) {
                    var cell = cursor();
                    tally = injector(tally, key(cell));
                    cursor = value(cell);
                }
                return tally;
            });
            method(join, function(self, separator) {
                var tally;
                var cursor = stream;
                while (cursor != null) {
                    var cell = cursor();
                    var itemAsString = asString(key(cell));
                    tally = tally ? tally + separator + itemAsString : itemAsString;
                    cursor = value(cell);
                }
                return tally;
            });
            method(collect, function(self, collector) {
                return Stream(function(cellConstructor) {
                    function collectingStream(stream) {
                        if (!stream) return null;
                        var cell = stream();
                        return function() {
                            return cellConstructor(collector(key(cell)), collectingStream(value(cell)));
                        };
                    }
                    return collectingStream(stream);
                });
            });
            method(contains, function(self, item) {
                var cursor = stream;
                while (cursor != null) {
                    var cell = cursor();
                    if (item == key(cell)) return true;
                    cursor = value(cell);
                }
                return false;
            });
            method(size, function(self) {
                var cursor = stream;
                var i = 0;
                while (cursor != null) {
                    i++;
                    cursor = value(cursor());
                }
                return i;
            });
            method(select, function(self, selector) {
                return Stream(function(cellConstructor) {
                    function select(stream) {
                        if (!stream) return null;
                        var cell = stream();
                        var k = key(cell);
                        var v = value(cell);
                        return selector(k) ? function() {
                            return cellConstructor(k, select(v));
                        } : select(v);
                    }
                    return select(stream);
                });
            });
            method(detect, function(self, detector, notDetectedThunk) {
                var cursor = stream;
                var result;
                while (cursor != null) {
                    var cell = cursor();
                    var k = key(cell);
                    if (detector(k)) {
                        result = k;
                        break;
                    }
                    cursor = value(cell);
                }
                if (result) {
                    return result;
                } else {
                    return notDetectedThunk ? notDetectedThunk(self) : null;
                }
            });
            method(isEmpty, function(self) {
                return stream == null;
            });
            method(copy, function(self) {
                return Stream(streamDefinition);
            });
            method(asString, function(self) {
                return 'Stream[' + join(self, ', ') + ']';
            });
        });
    }
    exportAs('indexOf', indexOf);
    exportAs('concatenate', concatenate);
    exportAs('append', append);
    exportAs('insert', insert);
    exportAs('each', each);
    exportAs('inject', inject);
    exportAs('select', select);
    exportAs('detect', detect);
    exportAs('contains', contains);
    exportAs('size', size);
    exportAs('empty', empty);
    exportAs('isEmpty', isEmpty);
    exportAs('notEmpty', notEmpty);
    exportAs('collect', collect);
    exportAs('sort', sort);
    exportAs('reverse', reverse);
    exportAs('copy', copy);
    exportAs('join', join);
    exportAs('inspect', inspect);
    exportAs('reject', reject);
    exportAs('intersect', intersect);
    exportAs('complement', complement);
    exportAs('broadcast', broadcast);
    exportAs('broadcaster', broadcaster);
    exportAs('asArray', asArray);
    exportAs('asSet', asSet);
    exportAs('key', key);
    exportAs('value', value);
    exportAs('Cell', Cell);
    exportAs('Stream', Stream);
});
ice.lib.configuration = ice.module(function(exportAs) {
    eval(ice.importFrom('ice.lib.oo'));
    eval(ice.importFrom('ice.lib.string'));
    eval(ice.importFrom('ice.lib.collection'));
    var attributeAsString = operator();
    var attributeAsBoolean = operator();
    var attributeAsNumber = operator();
    var valueAsStrings = operator();
    var valueAsBooleans = operator();
    var valueAsNumbers = operator();
    var childConfiguration = operator();
    function XMLDynamicConfiguration(lookupElement) {
        function asBoolean(s) {
            return 'true' == toLowerCase(s);
        }
        function lookupAttribute(name) {
            var a = lookupElement().getAttribute(name);
            if (a) {
                return a;
            } else {
                throw 'unknown attribute: ' + name;
            }
        }
        function lookupValues(name) {
            return collect(asArray(lookupElement().getElementsByTagName(name)), function(e) {
                var valueNode = e.firstChild;
                return valueNode ? valueNode.nodeValue : '';
            });
        }
        return object(function(method) {
            method(attributeAsString, function(self, name, defaultValue) {
                try {
                    return lookupAttribute(name);
                } catch (e) {
                    if (isString(defaultValue)) {
                        return defaultValue;
                    } else {
                        throw e;
                    }
                }
            });
            method(attributeAsNumber, function(self, name, defaultValue) {
                try {
                    return Number(lookupAttribute(name));
                } catch (e) {
                    if (isNumber(defaultValue)) {
                        return defaultValue;
                    } else {
                        throw e;
                    }
                }
            });
            method(attributeAsBoolean, function(self, name, defaultValue) {
                try {
                    return asBoolean(lookupAttribute(name));
                } catch (e) {
                    if (isBoolean(defaultValue)) {
                        return defaultValue;
                    } else {
                        throw e;
                    }
                }
            });
            method(childConfiguration, function(self, name) {
                var elements = lookupElement().getElementsByTagName(name);
                if (isEmpty(elements)) {
                    throw 'unknown configuration: ' + name;
                } else {
                    return XMLDynamicConfiguration(function() {
                        return lookupElement().getElementsByTagName(name)[0];
                    });
                }
            });
            method(valueAsStrings, function(self, name, defaultValues) {
                var values = lookupValues(name);
                return isEmpty(values) && defaultValues ? defaultValues : values;
            });
            method(valueAsNumbers, function(self, name, defaultValues) {
                var values = lookupValues(name);
                return isEmpty(values) && defaultValues ? defaultValues : collect(values, Number);
            });
            method(valueAsBooleans, function(self, name, defaultValues) {
                var values = lookupValues(name);
                return isEmpty(values) && defaultValues ? defaultValues : collect(values, asBoolean);
            });
        });
    }
    exportAs('attributeAsString', attributeAsString);
    exportAs('attributeAsBoolean', attributeAsBoolean);
    exportAs('attributeAsNumber', attributeAsNumber);
    exportAs('valueAsStrings', valueAsStrings);
    exportAs('valueAsBooleans', valueAsBooleans);
    exportAs('valueAsNumbers', valueAsNumbers);
    exportAs('childConfiguration', childConfiguration);
    exportAs('XMLDynamicConfiguration', XMLDynamicConfiguration);
});
ice.lib.window = ice.module(function(exportAs) {
    eval(ice.importFrom('ice.lib.functional'));
    eval(ice.importFrom('ice.lib.collection'));
    function registerListener(eventType, obj, listener) {
        if (obj.addEventListener) {
            obj.addEventListener(eventType, listener, false);
            return function() {
                obj.removeEventListener(eventType, listener, false);
            }
        } else {
            var type = 'on' + eventType;
            obj.attachEvent(type, listener);
            return function() {
                obj.detachEvent(type, listener);
            }
        }
    }
    var onLoad = curry(registerListener, 'load');
    var onUnload = curry(registerListener, 'unload');
    var onBeforeUnload = curry(registerListener, 'beforeunload');
    var onResize = curry(registerListener, 'resize');
    var onKeyPress = curry(registerListener, 'keypress');
    var onKeyUp = curry(registerListener, 'keyup');
    window.width = function() {
        return window.innerWidth ? window.innerWidth : (document.documentElement && document.documentElement.clientWidth) ? document.documentElement.clientWidth : document.body.clientWidth;
    };
    window.height = function() {
        return window.innerHeight ? window.innerHeight : (document.documentElement && document.documentElement.clientHeight) ? document.documentElement.clientHeight : document.body.clientHeight;
    };
    exportAs('registerListener', registerListener);
    exportAs('onLoad', onLoad);
    exportAs('onUnload', onUnload);
    exportAs('onBeforeUnload', onBeforeUnload);
    exportAs('onResize', onResize);
    exportAs('onKeyPress', onKeyPress);
    exportAs('onKeyUp', onKeyUp);
});
ice.lib.cookie = ice.module(function(exportAs) {
    eval(ice.importFrom('ice.lib.oo'));
    eval(ice.importFrom('ice.lib.string'));
    eval(ice.importFrom('ice.lib.collection'));
    function lookupCookieValue(name) {
        var tupleString = detect(split(asString(document.cookie), '; '), function(tuple) {
            return startsWith(tuple, name);
        }, function() {
            throw 'Cannot find value for cookie: ' + name;
        });
        return decodeURIComponent(contains(tupleString, '=') ? split(tupleString, '=')[1] : '');
    }
    function lookupCookie(name, failThunk) {
        try {
            return Cookie(name, lookupCookieValue(name));
        } catch (e) {
            if (failThunk) {
                return failThunk();
            } else {
                throw e;
            }
        }
    }
    function existsCookie(name) {
        var exists = true;
        lookupCookie(name, function() {
            exists = false;
        });
        return exists;
    }
    var update = operator();
    var remove = operator();
    function Cookie(name, val, path) {
        val = val || '';
        path = path || '/';
        document.cookie = name + '=' + encodeURIComponent(val) + '; path=' + path;
        return object(function(method) {
            method(value, function(self) {
                return lookupCookieValue(name);
            });
            method(update, function(self, val) {
                document.cookie = name + '=' + encodeURIComponent(val) + '; path=' + path;
                return self;
            });
            method(remove, function(self) {
                var date = new Date();
                date.setTime(date.getTime() - 24 * 60 * 60 * 1000);
                document.cookie = name + '=; expires=' + date.toGMTString() + '; path=' + path;
            });
            method(asString, function(self) {
                return 'Cookie[' + name + ', ' + value(self) + ', ' + path + ']';
            });
        });
    }
    exportAs('lookupCookieValue', lookupCookieValue);
    exportAs('lookupCookie', lookupCookie);
    exportAs('existsCookie', existsCookie);
    exportAs('update', update);
    exportAs('remove', remove);
    exportAs('Cookie', Cookie);
});
ice.lib.query = ice.module(function(exportAs) {
    eval(ice.importFrom('ice.lib.functional'));
    eval(ice.importFrom('ice.lib.oo'));
    eval(ice.importFrom('ice.lib.collection'));
    var asURIEncodedString = operator();
    var serializeOn = operator();
    function Parameter(name, value) {
        return objectWithAncestors(function(method) {
            method(asURIEncodedString, function(self) {
                return encodeURIComponent(name) + '=' + encodeURIComponent(value);
            });
            method(serializeOn, function(self, query) {
                addParameter(query, self);
            });
        }, Cell(name, value));
    }
    var addParameter = operator();
    var addNameValue = operator();
    var queryParameters = operator();
    var addQuery = operator();
    var appendToURI = operator();
    function Query() {
        var parameters = [];
        return object(function(method) {
            method(queryParameters, function(self) {
                return parameters;
            });
            method(addParameter, function(self, parameter) {
                append(parameters, parameter);
                return self;
            });
            method(addNameValue, function(self, name, value) {
                append(parameters, Parameter(name, value));
                return self;
            });
            method(addQuery, function(self, appended) {
                serializeOn(appended, self);
                return self;
            });
            method(serializeOn, function(self, query) {
                each(parameters, curry(addParameter, query));
            });
            method(asURIEncodedString, function(self) {
                return join(collect(parameters, asURIEncodedString), '&');
            });
            method(appendToURI, function(self, uri) {
                if (not(isEmpty(parameters))) {
                    return uri + (contains(uri, '?') ? '&' : '?') + asURIEncodedString(self);
                } else {
                    return uri;
                }
            });
            method(asString, function(self) {
                return inject(parameters, '', function(tally, p) {
                    return tally + '|' + key(p) + '=' + value(p) + '|\n';
                });
            });
        });
    }
    exportAs('asURIEncodedString', asURIEncodedString);
    exportAs('serializeOn', serializeOn);
    exportAs('Parameter', Parameter);
    exportAs('Query', Query);
    exportAs('addParameter', addParameter);
    exportAs('addNameValue', addNameValue);
    exportAs('queryParameters', queryParameters);
    exportAs('addQuery', addQuery);
    exportAs('appendToURI', appendToURI);
});
ice.lib.http = ice.module(function(exportAs) {
    eval(ice.importFrom('ice.lib.functional'));
    eval(ice.importFrom('ice.lib.oo'));
    eval(ice.importFrom('ice.lib.collection'));
    eval(ice.importFrom('ice.lib.query'));
    var getSynchronously = operator();
    var getAsynchronously = operator();
    var postSynchronously = operator();
    var postAsynchronously = operator();
    var deleteAsynchronously = operator();
    var Client = exportAs('Client', function(autoclose) {
        var newNativeRequest;
        if (window.XMLHttpRequest) {
            newNativeRequest = function() {
                return new XMLHttpRequest();
            };
        } else if (window.ActiveXObject) {
            newNativeRequest = function() {
                return new window.ActiveXObject('Microsoft.XMLHTTP');
            };
        } else {
            throw 'cannot create XMLHttpRequest';
        }
        function withNewQuery(setup) {
            var query = Query();
            setup(query);
            return query;
        }
        var autoClose = autoclose ? close : noop;
        return object(function(method) {
            method(getAsynchronously, function(self, uri, setupQuery, setupRequest, onResponse) {
                var nativeRequestResponse = newNativeRequest();
                var request = RequestProxy(nativeRequestResponse);
                var response = ResponseProxy(nativeRequestResponse);
                nativeRequestResponse.open('GET', appendToURI(withNewQuery(setupQuery), uri), true);
                setupRequest(request);
                nativeRequestResponse.onreadystatechange = function() {
                    if (nativeRequestResponse.readyState == 4) {
                        onResponse(response, request);
                        autoClose(request);
                    }
                };
                nativeRequestResponse.send('');
                return request;
            });
            method(getSynchronously, function(self, uri, setupQuery, setupRequest, onResponse) {
                var nativeRequestResponse = newNativeRequest();
                var request = RequestProxy(nativeRequestResponse);
                var response = ResponseProxy(nativeRequestResponse);
                nativeRequestResponse.open('GET', appendToURI(withNewQuery(setupQuery), uri), false);
                setupRequest(request);
                nativeRequestResponse.send('');
                onResponse(response, request);
                autoClose(request);
            });
            method(postAsynchronously, function(self, uri, setupQuery, setupRequest, onResponse) {
                var nativeRequestResponse = newNativeRequest();
                var request = RequestProxy(nativeRequestResponse);
                var response = ResponseProxy(nativeRequestResponse);
                nativeRequestResponse.open('POST', uri, true);
                setupRequest(request);
                nativeRequestResponse.onreadystatechange = function() {
                    if (nativeRequestResponse.readyState == 4) {
                        onResponse(response, request);
                        autoClose(request);
                    }
                };
                var requestBody = typeof setupQuery == 'function' ? withNewQuery(setupQuery) : setupQuery;
                nativeRequestResponse.send(requestBody);
                return request;
            });
            method(postSynchronously, function(self, uri, setupQuery, setupRequest, onResponse) {
                var nativeRequestResponse = newNativeRequest();
                var request = RequestProxy(nativeRequestResponse);
                var response = ResponseProxy(nativeRequestResponse);
                nativeRequestResponse.open('POST', uri, false);
                setupRequest(request);
                var requestBody = typeof setupQuery == 'function' ? withNewQuery(setupQuery) : setupQuery;
                nativeRequestResponse.send(requestBody);
                onResponse(response, request);
                autoClose(request);
            });
            method(deleteAsynchronously, function(self, uri, setupQuery, setupRequest, onResponse) {
                var nativeRequestResponse = newNativeRequest();
                var request = RequestProxy(nativeRequestResponse);
                var response = ResponseProxy(nativeRequestResponse);
                nativeRequestResponse.open('DELETE', appendToURI(withNewQuery(setupQuery), uri), true);
                setupRequest(request);
                nativeRequestResponse.onreadystatechange = function() {
                    if (nativeRequestResponse.readyState == 4) {
                        onResponse(response, request);
                        autoClose(request);
                    }
                };
                nativeRequestResponse.send('');
                return request;
            });
        });
    });
    var close = operator();
    var abort = operator();
    var setHeader = operator();
    var onResponse = operator();
    function RequestProxy(nativeRequestResponse) {
        return object(function(method) {
            method(setHeader, function(self, name, value) {
                nativeRequestResponse.setRequestHeader(name, value);
            });
            method(close, function(self) {
                nativeRequestResponse.onreadystatechange = noop;
            });
            method(abort, function(self) {
                nativeRequestResponse.onreadystatechange = noop;
                nativeRequestResponse.abort();
                method(abort, noop);
            });
        });
    }
    var statusCode = operator();
    var statusText = operator();
    var getHeader = operator();
    var getAllHeaders = operator();
    var hasHeader = operator();
    var contentAsText = operator();
    var contentAsDOM = operator();
    function ResponseProxy(nativeRequestResponse) {
        return object(function(method) {
            method(statusCode, function() {
                try {
                    return nativeRequestResponse.status;
                } catch (e) {
                    return 0;
                }
            });
            method(statusText, function(self) {
                try {
                    return nativeRequestResponse.statusText;
                } catch (e) {
                    return '';
                }
            });
            method(hasHeader, function(self, name) {
                try {
                    var header = nativeRequestResponse.getResponseHeader(name);
                    return header && header != '';
                } catch (e) {
                    return false;
                }
            });
            method(getHeader, function(self, name) {
                try {
                    return nativeRequestResponse.getResponseHeader(name);
                } catch (e) {
                    return null;
                }
            });
            method(getAllHeaders, function(self, name) {
                try {
                    return collect(reject(split(nativeRequestResponse.getAllResponseHeaders(), '\n'), isEmpty), function(pair) {
                        var nameValue = split(pair, ': ')
                        return Cell(nameValue[0], nameValue[1]);
                    });
                } catch (e) {
                    return [];
                }
            });
            method(contentAsText, function(self) {
                try {
                    return nativeRequestResponse.responseText;
                } catch (e) {
                    return '';
                }
            });
            method(contentAsDOM, function(self) {
                try {
                    return nativeRequestResponse.responseXML;
                } catch (e) {
                    var txt = '<error>' + e + '</error>';
                    var doc;
                    if (window.DOMParser) {
                        var parser = new DOMParser();
                        doc = parser.parseFromString(txt,"text/xml");
                    } else {
                        doc = new ActiveXObject("Microsoft.XMLDOM");
                        doc.async = false;
                        doc.loadXML(txt);
                    }
                    return doc;
                }
            });
            method(asString, function(self) {
                return inject(getAllHeaders(self), 'HTTP Response\n', function(result, header) {
                    return result + key(header) + ': ' + value(header) + '\n';
                }) + contentAsText(self);
            });
        });
    }
    function OK(response) {
        return statusCode(response) == 200;
    }
    function NotFound(response) {
        return statusCode(response) == 404;
    }
    function ServerInternalError(response) {
        var code = statusCode(response);
        return code >= 500 && code < 600;
    }
    function FormPost(request) {
        setHeader(request, 'Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    }
    exportAs('getSynchronously', getSynchronously);
    exportAs('getAsynchronously', getAsynchronously);
    exportAs('postSynchronously', postSynchronously);
    exportAs('postAsynchronously', postAsynchronously);
    exportAs('deleteAsynchronously', deleteAsynchronously);
    exportAs('close', close);
    exportAs('abort', abort);
    exportAs('setHeader', setHeader);
    exportAs('onResponse', onResponse);
    exportAs('statusCode', statusCode);
    exportAs('statusText', statusText);
    exportAs('getHeader', getHeader);
    exportAs('getAllHeaders', getAllHeaders);
    exportAs('hasHeader', hasHeader);
    exportAs('contentAsText', contentAsText);
    exportAs('contentAsDOM', contentAsDOM);
    exportAs('OK', OK);
    exportAs('NotFound', NotFound);
    exportAs('ServerInternalError', ServerInternalError);
    exportAs('FormPost', FormPost);
});
ice.lib.hashtable = ice.module(function(define) {
    eval(ice.importFrom('ice.lib.functional'));
    eval(ice.importFrom('ice.lib.oo'));
    eval(ice.importFrom('ice.lib.collection'));
    var at = operator();
    var putAt = operator();
    var removeAt = operator();
    var removeInArray = Array.prototype.splice ? function(array, index) {
        array.splice(index, 1);
    } : function(array, index) {
        if (index == array.length - 1) {
            array.length = index;
        } else {
            var rightSlice = array.slice(index + 1);
            array.length = index;
            for (var i = 0, l = rightSlice.length; i < l; ++i) {
                array[index + i] = rightSlice[i];
            }
        }
    };
    function atPrimitive(buckets, bucketCount, k, notFoundThunk) {
        var index = hash(k) % bucketCount;
        var bucket = buckets[index];
        if (bucket) {
            for (var i = 0, l = bucket.length; i < l; i++) {
                var entry = bucket[i];
                if (equal(entry.key, k)) {
                    return entry.value;
                }
            }
            if (notFoundThunk) notFoundThunk();
            return null;
        } else {
            if (notFoundThunk) notFoundThunk();
            return null;
        }
    }
    function putAtPrimitive(buckets, bucketCount, k, v) {
        var index = hash(k) % bucketCount;
        var bucket = buckets[index];
        if (bucket) {
            for (var i = 0, l = bucket.length; i < l; i++) {
                var entry = bucket[i];
                if (equal(entry.key, k)) {
                    var oldValue = entry.value;
                    entry.value = v;
                    return oldValue;
                }
            }
            bucket.push({ key:k, value: v });
            return null;
        } else {
            bucket = [
                {
                    key:k,
                    value: v
                }
            ];
            buckets[index] = bucket;
            return null;
        }
    }
    function removeAtPrimitive(buckets, bucketCount, k) {
        var index = hash(k) % bucketCount;
        var bucket = buckets[index];
        if (bucket) {
            for (var i = 0, l = bucket.length; i < l; i++) {
                var entry = bucket[i];
                if (equal(entry.key, k)) {
                    removeInArray(bucket, i);
                    if (bucket.length == 0) {
                        removeInArray(buckets, index);
                    }
                    return entry.value;
                }
            }
            return null;
        } else {
            return null;
        }
    }
    function injectPrimitive(buckets, initialValue, iterator) {
        var tally = initialValue;
        for (var i = 0, lbs = buckets.length; i < lbs; i++) {
            var bucket = buckets[i];
            if (bucket) {
                for (var j = 0, lb = bucket.length; j < lb; j++) {
                    var entry = bucket[j];
                    if (entry) {
                        tally = iterator(tally, entry.key, entry.value);
                    }
                }
            }
        }
        return tally;
    }
    var internalBuckets = operator();
    var internalBucketCount = operator();
    function HashTable() {
        var buckets = [];
        var bucketCount = 5000;
        return object(function(method) {
            method(at, function(self, k, notFoundThunk) {
                return atPrimitive(buckets, bucketCount, k, notFoundThunk);
            });
            method(putAt, function(self, k, v) {
                return putAtPrimitive(buckets, bucketCount, k, v);
            });
            method(removeAt, function(self, k) {
                return removeAtPrimitive(buckets, bucketCount, k);
            });
            method(each, function(iterator) {
                injectPrimitive(buckets, null, function(tally, k, v) {
                    iterator(k, v);
                });
            });
        });
    }
    function HashSet(list) {
        var buckets = [];
        var bucketCount = 5000;
        var present = new Object;
        if (list) {
            each(list, function(k) {
                putAtPrimitive(buckets, bucketCount, k, present);
            });
        }
        return object(function(method) {
            method(append, function(self, k) {
                putAtPrimitive(buckets, bucketCount, k, present);
            });
            method(each, function(self, iterator) {
                injectPrimitive(buckets, null, function(t, k, v) {
                    iterator(k);
                });
            });
            method(contains, function(self, k) {
                return !!atPrimitive(buckets, bucketCount, k);
            });
            method(complement, function(self, other) {
                var result = [];
                var c;
                try {
                    var othersInternalBuckets = internalBuckets(other);
                    var othersInternalBucketCount = internalBucketCount(other);
                    c = function(items, k) {
                        return !!atPrimitive(othersInternalBuckets, othersInternalBucketCount, k);
                    };
                } catch (e) {
                    c = contains;
                }
                return injectPrimitive(buckets, result, function(tally, k, v) {
                    if (!c(other, k)) {
                        result.push(k);
                    }
                    return tally;
                });
            });
            method(asString, function(self) {
                return 'HashSet[' + join(injectPrimitive(buckets, [], function(tally, k, v) {
                    tally.push(k);
                    return tally;
                }), ',') + ']';
            });
            method(internalBuckets, function(self) {
                return buckets;
            });
            method(internalBucketCount, function(self) {
                return bucketCount;
            });
        });
    }
    define('at', at);
    define('putAt', putAt);
    define('removeAt', removeAt);
    define('HashTable', HashTable);
    define('HashSet', HashSet);
});
ice.lib.element = ice.module(function(exportAs) {
    eval(ice.importFrom('ice.lib.string'));
    eval(ice.importFrom('ice.lib.collection'));
    eval(ice.importFrom('ice.lib.query'));
    function identifier(element) {
        return element ? element.id : null;
    }
    function tag(element) {
        return toLowerCase(element.nodeName);
    }
    function property(element, name) {
        return element[name];
    }
    function parents(element) {
        return Stream(function(cellConstructor) {
            function parentStream(e) {
                if (e == null || e == document) return null;
                return function() {
                    return cellConstructor(e, parentStream(e.parentNode));
                };
            }
            return parentStream(element.parentNode);
        });
    }
    function enclosingForm(element) {
        return element.form || detect(parents(element), function(e) {
            return tag(e) == 'form';
        }, function() {
            throw 'cannot find enclosing form';
        });
    }
    function enclosingBridge(element) {
        return property(detect(parents(element), function(e) {
            return property(e, 'bridge') != null;
        }, function() {
            throw 'cannot find enclosing bridge';
        }), 'bridge');
    }
    function serializeElementOn(element, query) {
        var tagName = tag(element);
        switch (tagName) {
            case 'a':
                var name = element.name || element.id;
                if (name) addNameValue(query, name, name);
                break;
            case 'input':
                switch (element.type) {
                    case 'image':
                    case 'submit':
                    case 'button':
                        addNameValue(query, element.name, element.value);
                        break;
                }
                break;
            case 'button':
                if (element.type == 'submit') addNameValue(query, element.name, element.value);
                break;
            default:
        }
    }
    function $elementWithID(id) {
        return document.getElementById(id);
    }
    exportAs('identifier', identifier);
    exportAs('tag', tag);
    exportAs('property', property);
    exportAs('parents', parents);
    exportAs('enclosingForm', enclosingForm);
    exportAs('enclosingBridge', enclosingBridge);
    exportAs('serializeElementOn', serializeElementOn);
    exportAs('$elementWithID', $elementWithID);
});
ice.lib.event = ice.module(function(exportAs) {
    eval(ice.importFrom('ice.lib.functional'));
    eval(ice.importFrom('ice.lib.oo'));
    eval(ice.importFrom('ice.lib.collection'));
    eval(ice.importFrom('ice.lib.query'));
    eval(ice.importFrom('ice.lib.element'));
    var cancel = operator();
    var cancelBubbling = operator();
    var cancelDefaultAction = operator();
    var isKeyEvent = operator();
    var isMouseEvent = operator();
    var capturedBy = operator();
    var triggeredBy = operator();
    var serializeEventOn = operator();
    var type = operator();
    var yes = any;
    var no = none;
    function isIEEvent(event) {
        return event.srcElement && !event.target;
    }
    function Event(event, capturingElement) {
        return object(function (method) {
            method(cancel, function (self) {
                cancelBubbling(self);
                cancelDefaultAction(self);
            });
            method(isKeyEvent, no);
            method(isMouseEvent, no);
            method(type, function (self) {
                return event.type;
            });
            method(triggeredBy, function (self) {
                return capturingElement;
            });
            method(capturedBy, function (self) {
                return capturingElement;
            });
            method(serializeEventOn, function (self, query) {
                serializeElementOn(capturingElement, query);
                addNameValue(query, 'ice.event.target', identifier(triggeredBy(self)));
                addNameValue(query, 'ice.event.captured', identifier(capturedBy(self)));
                addNameValue(query, 'ice.event.type', 'on' + type(self));
            });
            method(serializeOn, curry(serializeEventOn));
        });
    }
    function IEEvent(event, capturingElement) {
        return objectWithAncestors(function (method) {
            method(triggeredBy, function (self) {
                return event.srcElement ? event.srcElement : null;
            });
            method(cancelBubbling, function (self) {
                event.cancelBubble = true;
            });
            method(cancelDefaultAction, function (self) {
                event.returnValue = false;
            });
            method(asString, function (self) {
                return 'IEEvent[' + type(self) + ']';
            });
        }, Event(event, capturingElement));
    }
    function NetscapeEvent(event, capturingElement) {
        return objectWithAncestors(function (method) {
            method(triggeredBy, function (self) {
                return event.target ? event.target : null;
            });
            method(cancelBubbling, function (self) {
                try {
                    event.stopPropagation();
                } catch (e) {
                }
            });
            method(cancelDefaultAction, function (self) {
                try {
                    event.preventDefault();
                } catch (e) {
                }
            });
            method(asString, function (self) {
                return 'NetscapeEvent[' + type(self) + ']';
            });
        }, Event(event, capturingElement));
    }
    var isAltPressed = operator();
    var isCtrlPressed = operator();
    var isShiftPressed = operator();
    var isMetaPressed = operator();
    var serializeKeyOrMouseEventOn = operator();
    function KeyOrMouseEvent(event) {
        return object(function (method) {
            method(isAltPressed, function (self) {
                return event.altKey;
            });
            method(isCtrlPressed, function (self) {
                return event.ctrlKey;
            });
            method(isShiftPressed, function (self) {
                return event.shiftKey;
            });
            method(isMetaPressed, function (self) {
                return event.metaKey;
            });
            method(serializeKeyOrMouseEventOn, function (self, query) {
                addNameValue(query, 'ice.event.alt', isAltPressed(self));
                addNameValue(query, 'ice.event.ctrl', isCtrlPressed(self));
                addNameValue(query, 'ice.event.shift', isShiftPressed(self));
                addNameValue(query, 'ice.event.meta', isMetaPressed(self));
            });
        });
    }
    var isLeftButton = operator();
    var isRightButton = operator();
    var positionX = operator();
    var positionY = operator();
    var serializeMouseEventOn = operator();
    function MouseEvent(event) {
        return objectWithAncestors(function (method) {
            method(isMouseEvent, yes);
            method(serializeMouseEventOn, function (self, query) {
                serializeKeyOrMouseEventOn(self, query);
                addNameValue(query, 'ice.event.x', positionX(self));
                addNameValue(query, 'ice.event.y', positionY(self));
                addNameValue(query, 'ice.event.left', isLeftButton(self));
                addNameValue(query, 'ice.event.right', isRightButton(self));
            });
        }, KeyOrMouseEvent(event));
    }
    function MouseEventTrait(method) {
        method(serializeOn, function (self, query) {
            serializeEventOn(self, query);
            serializeMouseEventOn(self, query);
        });
    }
    function IEMouseEvent(event, capturingElement) {
        return objectWithAncestors(function (method) {
            MouseEventTrait(method);
            method(positionX, function (self) {
                return event.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft);
            });
            method(positionY, function (self) {
                return event.clientY + (document.documentElement.scrollTop || document.body.scrollTop);
            });
            method(isLeftButton, function (self) {
                return event.button == 1;
            });
            method(isRightButton, function (self) {
                return event.button == 2;
            });
            method(asString, function (self) {
                return 'IEMouseEvent[' + type(self) + ']';
            });
        }, MouseEvent(event), IEEvent(event, capturingElement));
    }
    function NetscapeMouseEvent(event, capturingElement) {
        return objectWithAncestors(function (method) {
            MouseEventTrait(method);
            method(positionX, function (self) {
                return event.pageX;
            });
            method(positionY, function (self) {
                return event.pageY;
            });
            method(isLeftButton, function (self) {
                return event.which == 1;
            });
            method(isRightButton, function (self) {
                return event.which == 2;
            });
            method(asString, function (self) {
                return 'NetscapeMouseEvent[' + type(self) + ']';
            });
        }, MouseEvent(event), NetscapeEvent(event, capturingElement));
    }
    var keyCharacter = operator();
    var keyCode = operator();
    var serializeKeyEventOn = operator();
    function KeyEvent(event) {
        return objectWithAncestors(function (method) {
            method(isKeyEvent, yes);
            method(keyCharacter, function (self) {
                return String.fromCharCode(keyCode(self));
            });
            method(serializeKeyEventOn, function (self, query) {
                serializeKeyOrMouseEventOn(self, query);
                addNameValue(query, 'ice.event.keycode', keyCode(self));
            });
        }, KeyOrMouseEvent(event));
    }
    function KeyEventTrait(method) {
        method(serializeOn, function (self, query) {
            serializeEventOn(self, query);
            serializeKeyEventOn(self, query);
        });
    }
    function IEKeyEvent(event, capturingElement) {
        return objectWithAncestors(function (method) {
            KeyEventTrait(method);
            method(keyCode, function (self) {
                return event.keyCode;
            });
            method(asString, function (self) {
                return 'IEKeyEvent[' + type(self) + ']';
            });
        }, KeyEvent(event), IEEvent(event, capturingElement));
    }
    function NetscapeKeyEvent(event, capturingElement) {
        return objectWithAncestors(function (method) {
            KeyEventTrait(method);
            method(keyCode, function (self) {
                return event.which == 0 ? event.keyCode : event.which;
            });
            method(asString, function (self) {
                return 'NetscapeKeyEvent[' + type(self) + ']';
            });
        }, KeyEvent(event), NetscapeEvent(event, capturingElement));
    }
    function isEnterKey(event) {
        return keyCode(event) == 13;
    }
    function isEscKey(event) {
        return keyCode(event) == 27;
    }
    function UnknownEvent(capturingElement) {
        return objectWithAncestors(function (method) {
            method(cancelBubbling, noop);
            method(cancelDefaultAction, noop);
            method(type, function (self) {
                return 'unknown';
            });
            method(asString, function (self) {
                return 'UnkownEvent[]';
            });
        }, Event(null, capturingElement));
    }
    var MouseListenerNames = [ 'onclick', 'ondblclick', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup' ];
    var KeyListenerNames = [ 'onkeydown', 'onkeypress', 'onkeyup', 'onhelp' ];
    function $event(e, element) {
        var capturedEvent = e || window.event;
        if (capturedEvent && capturedEvent.type) {
            var eventType = 'on' + capturedEvent.type;
            if (contains(KeyListenerNames, eventType)) {
                return isIEEvent(capturedEvent) ? IEKeyEvent(capturedEvent, element) : NetscapeKeyEvent(capturedEvent, element);
            } else if (contains(MouseListenerNames, eventType)) {
                return isIEEvent(capturedEvent) ? IEMouseEvent(capturedEvent, element) : NetscapeMouseEvent(capturedEvent, element);
            } else {
                return isIEEvent(capturedEvent) ? IEEvent(capturedEvent, element) : NetscapeEvent(capturedEvent, element);
            }
        } else {
            return UnknownEvent(element);
        }
    }
    exportAs('cancel', cancel);
    exportAs('cancelBubbling', cancelBubbling);
    exportAs('cancelDefaultAction', cancelDefaultAction);
    exportAs('isKeyEvent', isKeyEvent);
    exportAs('isMouseEvent', isMouseEvent);
    exportAs('capturedBy', capturedBy);
    exportAs('triggeredBy', triggeredBy);
    exportAs('serializeEventOn', serializeEventOn);
    exportAs('type', type);
    exportAs('isAltPressed', isAltPressed);
    exportAs('isCtrlPressed', isCtrlPressed);
    exportAs('isShiftPressed', isShiftPressed);
    exportAs('isMetaPressed', isMetaPressed);
    exportAs('isLeftButton', isLeftButton);
    exportAs('isRightButton', isRightButton);
    exportAs('positionX', positionX);
    exportAs('positionY', positionY);
    exportAs('keyCharacter', keyCharacter);
    exportAs('keyCode', keyCode);
    exportAs('isEnterKey', isEnterKey);
    exportAs('isEscKey', isEscKey);
    exportAs('$event', $event);
});
ice.lib.logger = ice.module(function(exportAs) {
    eval(ice.importFrom('ice.lib.functional'));
    eval(ice.importFrom('ice.lib.oo'));
    eval(ice.importFrom('ice.lib.collection'));
    eval(ice.importFrom('ice.lib.window'));
    eval(ice.importFrom('ice.lib.event'));
    eval(ice.importFrom('ice.lib.string'));
    var debug = operator();
    var info = operator();
    var warn = operator();
    var error = operator();
    var childLogger = operator();
    var log = operator();
    var threshold = operator();
    var enable = operator();
    var disable = operator();
    var toggle = operator();
    function Logger(category, handler) {
        return object(function(method) {
            each([debug, info, warn, error], function(priorityOperator) {
                method(priorityOperator, function(self, message, exception) {
                    log(handler, priorityOperator, category, message, exception);
                });
            });
            method(childLogger, function(self, categoryName, newHandler) {
                return Logger(append(copy(category), categoryName), newHandler || handler);
            });
            method(asString, function(self) {
                return 'Logger[' + join(category, '.') + ']';
            });
        });
    }
    function formatOutput(category, message) {
        var timestamp = (new Date()).toUTCString();
        return join(['[', join(category, '.'), '] [', timestamp, '] ', message], '');
    }
    function LocalStorageLogHandler(handler) {
        var enabled = false;
        if (window.addEventListener) {
            window.addEventListener('storage', function (e) {
                if (e.key == 'ice.localStorageLogHandler.enabled') {
                    enabled = e.newValue == 'yes';
                }
            }, false);
        }
        function storeLogMessage(level, message, exception) {
            var previousMessages = localStorage['ice.localStorageLogHandler.store'] || '';
            var fullMessage = '[' + level + '] [' + ice.windowID + '] ' + message;
            if (exception) {
                fullMessage = fullMessage + '\n' + exception.message;
            }
            var messages = previousMessages + '%%' + fullMessage;
            var maxStorageUsed = localStorage['ice.localStorageLogHandler.maxSize'] || 500;
            var overflow = messages.length - maxStorageUsed * 1024;
            if (overflow > 0) {
                messages = messages.substr(overflow);
            }
            localStorage['ice.localStorageLogHandler.currentEntry'] = fullMessage;
            localStorage['ice.localStorageLogHandler.store'] = messages;
        }
        return object(function(method) {
            method(threshold, function(self, priority) {
                threshold(handler, priority);
            });
            method(log, function(self, operation, category, message, exception) {
                if (window.localStorage && window.localStorage['ice.localStorageLogHandler.enabled'] || enabled) {
                    var formattedMessage = formatOutput(category, message);
                    var priorityName;
                    switch (operation) {
                        case debug:
                            priorityName = 'debug';
                            break;
                        case info:
                            priorityName = 'info ';
                            break;
                        case warn:
                            priorityName = 'warn ';
                            break;
                        case error:
                            priorityName = 'error';
                            break;
                        default:
                            priorityName = 'debug';
                    }
                    storeLogMessage(priorityName, formattedMessage, exception);
                }
                log(handler, operation, category, message, exception);
            });
        });
    }
    function ConsoleLogHandler(priority) {
        var ieConsole = !window.console.debug;
        var debugPrimitive = ieConsole ?
            function(self, category, message, exception) {
                exception ? console.log(formatOutput(category, message), '\n', exception) : console.log(formatOutput(category, message));
            } :
            function(self, category, message, exception) {
                exception ? console.debug(formatOutput(category, message), exception) : console.debug(formatOutput(category, message));
            };
        var infoPrimitive = ieConsole ?
            function(self, category, message, exception) {
                exception ? console.info(formatOutput(category, message), '\n', exception) : console.info(formatOutput(category, message));
            } :
            function(self, category, message, exception) {
                exception ? console.info(formatOutput(category, message), exception) : console.info(formatOutput(category, message));
            };
        var warnPrimitive = ieConsole ?
            function(self, category, message, exception) {
                exception ? console.warn(formatOutput(category, message), '\n', exception) : console.warn(formatOutput(category, message));
            } :
            function(self, category, message, exception) {
                exception ? console.warn(formatOutput(category, message), exception) : console.warn(formatOutput(category, message));
            };
        var errorPrimitive = ieConsole ?
            function(self, category, message, exception) {
                exception ? console.error(formatOutput(category, message), '\n', exception) : console.error(formatOutput(category, message));
            } :
            function(self, category, message, exception) {
                exception ? console.error(formatOutput(category, message), exception) : console.error(formatOutput(category, message));
            };
        var handlers = [
            Cell(debug, object(function(method) {
                method(debug, debugPrimitive);
                method(info, infoPrimitive);
                method(warn, warnPrimitive);
                method(error, errorPrimitive);
            })),
            Cell(info, object(function(method) {
                method(debug, noop);
                method(info, infoPrimitive);
                method(warn, warnPrimitive);
                method(error, errorPrimitive);
            })),
            Cell(warn, object(function(method) {
                method(debug, noop);
                method(info, noop);
                method(warn, warnPrimitive);
                method(error, errorPrimitive);
            })),
            Cell(error, object(function(method) {
                method(debug, noop);
                method(info, noop);
                method(warn, noop);
                method(error, errorPrimitive);
            }))
        ];
        var handler;
        function selectHandler(p) {
            handler = value(detect(handlers, function(cell) {
                return key(cell) == p;
            }));
        }
        selectHandler(priority || debug);
        return object(function (method) {
            method(threshold, function(self, priority) {
                selectHandler(priority);
            });
            method(log, function(self, operation, category, message, exception) {
                operation(handler, category, message, exception);
            });
        });
    }
    var FirebugLogHandler = ConsoleLogHandler;
    function WindowLogHandler(thresholdPriority, name) {
        var lineOptions = [25, 50, 100, 200, 400];
        var numberOfLines = lineOptions[3];
        var categoryMatcher = /.*/;
        var closeOnExit = true;
        var logContainer;
        var logEntry = noop;
        function trimLines() {
            var nodes = logContainer.childNodes;
            var trim = size(nodes) - numberOfLines;
            if (trim > 0) {
                each(copy(nodes), function(node, index) {
                    if (index < trim) logContainer.removeChild(node);
                });
            }
        }
        function trimAllLines() {
            each(copy(logContainer.childNodes), function(node) {
                logContainer.removeChild(node);
            });
        }
        function toggle() {
            var disabled = logEntry == noop;
            logEntry = disabled ? displayEntry : noop;
            return !disabled;
        }
        function displayEntry(priorityName, colorName, category, message, exception) {
            setTimeout(function() {
                try {
                    var categoryName = join(category, '.');
                    if (categoryMatcher.test(categoryName)) {
                        var elementDocument = logContainer.ownerDocument;
                        var timestamp = new Date();
                        var completeMessage = join(['[', categoryName, '] : ', message, (exception ? join(['\n', exception.name, ' <', exception.message, '>'], '') : '')], '');
                        each(split(completeMessage, '\n'), function(line) {
                            if (/(\w+)/.test(line)) {
                                var eventNode = elementDocument.createElement('div');
                                eventNode.style.padding = '3px';
                                eventNode.style.color = colorName;
                                eventNode.setAttribute("title", timestamp + ' | ' + priorityName)
                                logContainer.appendChild(eventNode).appendChild(elementDocument.createTextNode(line));
                            }
                        });
                        logContainer.scrollTop = logContainer.scrollHeight;
                    }
                    trimLines();
                } catch (ex) {
                    logEntry = noop;
                }
            }, 1);
        }
        function showWindow() {
            var logWindow = window.open('', '_blank', 'scrollbars=1,width=800,height=680');
            try {
                var windowDocument = logWindow.document;
                var documentBody = windowDocument.body;
                each(copy(documentBody.childNodes), function(e) {
                    windowDocument.body.removeChild(e);
                });
                documentBody.appendChild(windowDocument.createTextNode(' Close on exit '));
                var closeOnExitCheckbox = windowDocument.createElement('input');
                closeOnExitCheckbox.style.margin = '2px';
                closeOnExitCheckbox.setAttribute('type', 'checkbox');
                closeOnExitCheckbox.defaultChecked = true;
                closeOnExitCheckbox.checked = true;
                closeOnExitCheckbox.onclick = function() {
                    closeOnExit = closeOnExitCheckbox.checked;
                };
                documentBody.appendChild(closeOnExitCheckbox);
                documentBody.appendChild(windowDocument.createTextNode(' Lines '));
                var lineCountDropDown = windowDocument.createElement('select');
                lineCountDropDown.style.margin = '2px';
                each(lineOptions, function(count, index) {
                    var option = lineCountDropDown.appendChild(windowDocument.createElement('option'));
                    if (numberOfLines == count) lineCountDropDown.selectedIndex = index;
                    option.appendChild(windowDocument.createTextNode(asString(count)));
                });
                documentBody.appendChild(lineCountDropDown);
                documentBody.appendChild(windowDocument.createTextNode(' Category '));
                var categoryInputText = windowDocument.createElement('input');
                categoryInputText.style.margin = '2px';
                categoryInputText.setAttribute('type', 'text');
                categoryInputText.setAttribute('value', categoryMatcher.source);
                categoryInputText.onchange = function() {
                    categoryMatcher = new RegExp(categoryInputText.value);
                };
                documentBody.appendChild(categoryInputText);
                documentBody.appendChild(windowDocument.createTextNode(' Level '));
                var levelDropDown = windowDocument.createElement('select');
                levelDropDown.style.margin = '2px';
                var levels = [Cell('debug', debug), Cell('info', info), Cell('warn', warn), Cell('error', error)];
                each(levels, function(priority, index) {
                    var option = levelDropDown.appendChild(windowDocument.createElement('option'));
                    if (thresholdPriority == value(priority)) levelDropDown.selectedIndex = index;
                    option.appendChild(windowDocument.createTextNode(key(priority)));
                });
                levelDropDown.onchange = function(event) {
                    thresholdPriority = value(levels[levelDropDown.selectedIndex]);
                };
                documentBody.appendChild(levelDropDown);
                var startStopButton = windowDocument.createElement('input');
                startStopButton.style.margin = '2px';
                startStopButton.setAttribute('type', 'button');
                startStopButton.setAttribute('value', 'Stop');
                startStopButton.onclick = function() {
                    startStopButton.setAttribute('value', toggle() ? 'Stop' : 'Start');
                };
                documentBody.appendChild(startStopButton);
                var clearButton = windowDocument.createElement('input');
                clearButton.style.margin = '2px';
                clearButton.setAttribute('type', 'button');
                clearButton.setAttribute('value', 'Clear');
                documentBody.appendChild(clearButton);
                logContainer = documentBody.appendChild(windowDocument.createElement('pre'));
                logContainer.id = 'log-window';
                var logContainerStyle = logContainer.style;
                logContainerStyle.width = '100%';
                logContainerStyle.minHeight = '0';
                logContainerStyle.maxHeight = '550px';
                logContainerStyle.borderWidth = '1px';
                logContainerStyle.borderStyle = 'solid';
                logContainerStyle.borderColor = '#999';
                logContainerStyle.backgroundColor = '#ddd';
                logContainerStyle.overflow = 'scroll';
                lineCountDropDown.onchange = function(event) {
                    numberOfLines = lineOptions[lineCountDropDown.selectedIndex];
                    trimLines();
                };
                clearButton.onclick = trimAllLines;
                onUnload(window, function() {
                    if (closeOnExit) {
                        logEntry = noop;
                        logWindow.close();
                    }
                });
            } catch (e) {
                logWindow.close();
            }
        }
        onKeyUp(document, function(evt) {
            var event = $event(evt, document.documentElement);
            if (keyCode(event) == 84 && isCtrlPressed(event) && isShiftPressed(event)) {
                showWindow();
                logEntry = displayEntry;
            }
        });
        return object(function(method) {
            method(threshold, function(self, priority) {
                thresholdPriority = priority;
            });
            method(log, function(self, operation, category, message, exception) {
                operation(self, category, message, exception);
            });
            method(debug, function(self, category, message, exception) {
                logEntry('debug', '#333', category, message, exception);
            });
            method(info, function(self, category, message, exception) {
                logEntry('info', 'green', category, message, exception);
            });
            method(warn, function(self, category, message, exception) {
                logEntry('warn', 'orange', category, message, exception);
            });
            method(error, function(self, category, message, exception) {
                logEntry('error', 'red', category, message, exception);
            });
        });
    }
    exportAs('debug', debug);
    exportAs('info', info);
    exportAs('warn', warn);
    exportAs('error', error);
    exportAs('childLogger', childLogger);
    exportAs('log', log);
    exportAs('threshold', threshold);
    exportAs('enable', enable);
    exportAs('disable', disable);
    exportAs('toggle', toggle);
    exportAs('Logger', Logger);
    exportAs('ConsoleLogHandler', ConsoleLogHandler);
    exportAs('WindowLogHandler', WindowLogHandler);
    exportAs('LocalStorageLogHandler', LocalStorageLogHandler);
});
if (!window.ice) {
    window.ice = new Object;
}
if (!window.ice.icepush) {
    (function(namespace) {
        window.ice.icepush = true;
        eval(ice.importFrom('ice.lib.functional'));
        eval(ice.importFrom('ice.lib.oo'));
        eval(ice.importFrom('ice.lib.collection'));
        eval(ice.importFrom('ice.lib.string'));
        eval(ice.importFrom('ice.lib.delay'));
        eval(ice.importFrom('ice.lib.cookie'));
        eval(ice.importFrom('ice.lib.window'));
        eval(ice.importFrom('ice.lib.event'));
        eval(ice.importFrom('ice.lib.element'));
        eval(ice.importFrom('ice.lib.logger'));
        eval(ice.importFrom('ice.lib.query'));
        eval(ice.importFrom('ice.lib.http'));
        eval(ice.importFrom('ice.lib.configuration'));
        var ffMatch = navigator.userAgent.match(/Firefox\/(\w\.?\w)/);
        var firefoxGreaterThan3point6 = ffMatch ? (Number(ffMatch[1]) > 3.6) : true;
        var ie = window.attachEvent || /Trident.*rv\:11\./.test(navigator.userAgent) || /MSIE/.test(navigator.userAgent);
        function useLocalStorage() {
            var workingLocalStorage = false;
            if (window.localStorage) {
                var key = 'testLocalStorage';
                var value = String(Math.random());
                try {
                    window.localStorage[key] = value;
                    workingLocalStorage = window.localStorage[key] == value;
                } catch (ex) {
                    return false;
                } finally {
                    window.localStorage.removeItem(key);
                }
            }
            return workingLocalStorage && firefoxGreaterThan3point6 && !ie;
        }
        function detectByReference(ref) {
            return function (o) {
                return o == ref;
            };
        }
        function removeCallbackCallback(callbackList, detector) {
            return function removeCallback() {
                var temp = reject(callbackList, detector);
                empty(callbackList);
                each(temp, curry(append, callbackList));
            }
        }
        function CREATED(response) {
            return statusCode(response) == 201;
        }
        function NOCONTENT(response) {
            return statusCode(response) == 204;
        }
        function NOTFOUND(response) {
            return statusCode(response) == 404;
        }
        var register = operator();
        var deserializeAndExecute = operator();
        function CommandDispatcher() {
            var commands = [];
            function executeCommand(name, parameter) {
                var found = detect(commands, function(cell) {
                    return key(cell) == name;
                });
                if (found) {
                    value(found)(parameter);
                }
            }
            return object(function(method) {
                method(register, function(self, messageName, command) {
                    commands = reject(commands, function(cell) {
                        return key(cell) == messageName;
                    });
                    append(commands, Cell(messageName, command));
                });
                method(deserializeAndExecute, function(self, content) {
                    try {
                        var result = JSON.parse(content);
                        if (result.noop) {
                            executeCommand('noop',[]);
                        }
                        if (result.notifications) {
                            executeCommand('notifications', result.notifications);
                        }
                        if (result.configuration) {
                            executeCommand('configuration', result.configuration);
                        }
                        if (result.browser) {
                            executeCommand('browser', result.browser);
                        }
                    } catch (e) {
                        executeCommand('error', e);
                    }
                });
            });
        }
        function NoopCommand() {
            debug(namespace.logger, 'received noop');
        }
        function CommandError(err) {
            error(namespace.logger, 'error');
            error(namespace.logger, err);
        }
        var setValue = operator();
        var getValue = operator();
        var removeSlot = operator();
        var existsSlot;
        var Slot;
        (function () {
            var slots = {};
            var WindowSlot = function (name, val) {
                slots[name] = val || '';
                return object(function (method) {
                    method(getValue, function (self) {
                        var value = slots[name];
                        return value ? value : '';
                    });
                    method(setValue, function (self, val) {
                        slots[name] = val;
                    });
                    method(removeSlot, function(self) {
                        delete slots[name];
                    });
                });
            };
            var existsWindowSlot = function (name) {
                return slots[name] != null;
            };
            var BrowserSlot;
            var existsBrowserSlot;
            var removeBrowserSlot;
            if (useLocalStorage()) {
                BrowserSlot = function LocalStorageSlot(name, val) {
                    window.localStorage.setItem(name, window.localStorage.getItem(name) || '');
                    return object(function (method) {
                        method(getValue, function (self) {
                            var val = window.localStorage.getItem(name);
                            return val ? val : '';
                        });
                        method(setValue, function (self, val) {
                            window.localStorage.setItem(name, val || '');
                        });
                        method(removeSlot, function(self) {
                            window.localStorage.removeItem(name);
                        });
                    });
                };
                existsBrowserSlot = function (name) {
                    return window.localStorage.getItem(name) != null;
                };
            } else {
                BrowserSlot = function CookieSlot(name, val) {
                    var c = existsCookie(name) ? lookupCookie(name) : Cookie(name, val);
                    return object(function (method) {
                        method(getValue, function (self) {
                            try {
                                return value(c);
                            } catch (e) {
                                c = Cookie(name, '');
                                return '';
                            }
                        });
                        method(setValue, function (self, val) {
                            try {
                                update(c, val);
                            } catch (e) {
                                c = Cookie(name, val);
                            }
                        });
                        method(removeSlot, function(self) {
                            if (existsCookie(name)) {
                                remove(lookupCookie(name));
                            }
                        });
                    });
                };
                existsBrowserSlot = existsCookie;
            }
            function nonSharedSlot() {
                return namespace.push && namespace.push.configuration && namespace.push.configuration.nonSharedConnection;
            }
            Slot = function (name, val) {
                return object(function (method) {
                    var slot;
                    var previousSharingType;
                    function acquireSlot() {
                        var currentSharingType = nonSharedSlot();
                        var oldVal;
                        if (slot) {
                            oldVal = getValue(slot);
                        }
                        if (previousSharingType != currentSharingType || !slot) {
                            slot = currentSharingType ? WindowSlot(name) : BrowserSlot(name);
                            previousSharingType = currentSharingType;
                        }
                        if (oldVal) {
                            setValue(slot, oldVal);
                        }
                        return slot;
                    }
                    method(getValue, function (self) {
                        return getValue(acquireSlot());
                    });
                    method(setValue, function (self, val) {
                        setValue(acquireSlot(), val);
                    });
                    method(removeSlot, function(self) {
                        removeSlot(acquireSlot());
                    });
                });
            };
            existsSlot = function (name) {
                return nonSharedSlot() ? existsWindowSlot(name) : existsBrowserSlot(name);
            };
        }());
        var send = operator();
        var onSend = operator();
        var onReceive = operator();
        var onServerError = operator();
        var whenDown = operator();
        var whenTrouble = operator();
        var whenStopped = operator();
        var whenReEstablished = operator();
        var startConnection = operator();
        var resumeConnection = operator();
        var pauseConnection = operator();
        var reconfigure = operator();
        var shutdown = operator();
        var AsyncConnection;
        (function() {
            var SequenceNumber = 'ice.push.sequence';
            var ConnectionRunning = 'ice.connection.running';
            var ConnectionLease = 'ice.connection.lease';
            var AcquiredMarker = ':acquired';
            var NetworkDelay = 5000;
            var DefaultConfiguration = {
                heartbeat:{
                    interval: 6500
                },
                network_error_retry_timeouts: [1, 1, 1, 2, 2, 3],
                server_error_handler: {
                    delays: "1000, 2000, 4000"
                },
                response_timeout_handler: {
                    retries: 3
                }
            };
            function timedRetryAbort(retryAction, abortAction, timeouts) {
                var index = 0;
                var errorActions = inject(timeouts, [abortAction], function(actions, interval) {
                    return insert(actions, curry(runOnce, Delay(retryAction, interval)));
                });
                return function() {
                    if (index < errorActions.length) {
                        apply(errorActions[index], arguments);
                        index++;
                    }
                };
            }
            AsyncConnection = function(logger, windowID, mainConfiguration) {
                var logger = childLogger(logger, 'async-connection');
                var channel = Client(false);
                var onSendListeners = [];
                var onReceiveListeners = [];
                var onServerErrorListeners = [];
                var connectionDownListeners = [];
                var connectionTroubleListeners = [];
                var connectionStoppedListeners = [];
                var connectionReEstablished = [];
                var sequenceNo = Slot(SequenceNumber);
                var configuration = mainConfiguration.configuration || DefaultConfiguration;
                var heartbeatTimestamp = (new Date()).getTime();
                var listener = object(function(method) {
                    method(close, noop);
                    method(abort, noop);
                });
                onBeforeUnload(window, function() {
                    connectionDownListeners = [];
                });
                var lastSentPushIds = registeredPushIds();
                function requestForBlockingResponse() {
                    try {
                        debug(logger, "closing previous connection...");
                        close(listener);
                        lastSentPushIds = registeredPushIds();
                        if (isEmpty(lastSentPushIds)) {
                            stopTimeoutBombs();
                            broadcast(connectionStoppedListeners, ['connection stopped, no pushIDs registered']);
                        } else {
                            debug(logger, 'connect...');
                            var uri = mainConfiguration.uri + voyent.auth.getLastKnownAccount() + '/realms/' + voyent.auth.getLastKnownRealm() + '/push-ids?access_token=' + encodeURIComponent(voyent.auth.getLastAccessToken()) + '&op=listen';
                            var body = JSON.stringify({
                                'access_token': voyent.auth.getLastAccessToken(),
                                'browser': lookupCookieValue(BrowserIDName),
                                'heartbeat': {
                                    'timestamp': heartbeatTimestamp,
                                    'interval': heartbeatInterval
                                },
                                'op': 'listen',
                                'sequence_number': Number(getValue(sequenceNo) || '0'),
                                'window': namespace.windowID,
                                'push_ids': lastSentPushIds
                            });
                            listener = postAsynchronously(channel, uri, body, JSONRequest, $witch(function (condition) {
                                condition(OK, function (response) {
                                    var content = contentAsText(response);
                                    var reconnect = getHeader(response, 'X-Connection') != 'close';
                                    var nonEmptyResponse = notEmpty(content);
                                    if (reconnect) {
                                        if (nonEmptyResponse) {
                                            try {
                                                var result = JSON.parse(content);
                                                if (result.sequence_number) {
                                                    setValue(sequenceNo, result.sequence_number);
                                                }
                                                if (result.heartbeat && result.heartbeat.timestamp) {
                                                    heartbeatTimestamp = result.heartbeat.timestamp;
                                                }
                                                if (result.heartbeat && result.heartbeat.interval) {
                                                    if (heartbeatInterval != result.heartbeat.interval) {
                                                        heartbeatInterval = result.heartbeat.interval;
                                                        adjustTimeoutBombIntervals();
                                                    }
                                                }
                                            } finally {
                                                broadcast(onReceiveListeners, [response]);
                                                resetEmptyResponseRetries();
                                            }
                                        } else {
                                            warn(logger, 'empty response received');
                                            decrementEmptyResponseRetries();
                                        }
                                        if (anyEmptyResponseRetriesLeft()) {
                                            resetTimeoutBomb();
                                            connect();
                                        } else {
                                            info(logger, 'blocking connection stopped, too many empty responses received...');
                                        }
                                    } else {
                                        info(logger, 'blocking connection stopped at server\'s request...');
                                        var reason = getHeader(response, 'X-Connection-reason');
                                        if (reason) {
                                            info(logger, reason);
                                        }
                                        stopTimeoutBombs();
                                        broadcast(connectionStoppedListeners, ['connection stopped by server']);
                                    }
                                });
                                condition(ServerInternalError, retryOnServerError);
                            }));
                        }
                    } catch (e) {
                        error(logger, 'failed to re-initiate blocking connection', e);
                    }
                }
                var connect = requestForBlockingResponse;
                var heartbeatInterval;
                var networkErrorRetryTimeouts;
                function setupNetworkErrorRetries(cfg) {
                    heartbeatInterval = cfg.heartbeat.interval || DefaultConfiguration.heartbeat.interval;
                    networkErrorRetryTimeouts = cfg.network_error_retry_timeouts || DefaultConfiguration.network_error_retry_timeouts;
                    emptyResponseRetries = cfg.response_timeout_handler.retries || DefaultConfiguration.response_timeout_handler.retries;
                }
                setupNetworkErrorRetries(configuration);
                var serverErrorRetryTimeouts;
                var retryOnServerError;
                function setupServerErrorRetries(cfg) {
                    serverErrorRetryTimeouts = collect(split(cfg.server_error_handler && cfg.server_error_handler.delays ? cfg.server_error_handler.delays : DefaultConfiguration.server_error_retry_timeouts, ' '), Number);
                    retryOnServerError = timedRetryAbort(connect, broadcaster(onServerErrorListeners), serverErrorRetryTimeouts);
                }
                setupServerErrorRetries(configuration);
                var emptyResponseRetries;
                function resetEmptyResponseRetries() {
                    emptyResponseRetries = configuration.response_timeout_handler.retries || DefaultConfiguration.response_timeout_handler.retries;
                }
                function decrementEmptyResponseRetries() {
                    --emptyResponseRetries;
                }
                function anyEmptyResponseRetriesLeft() {
                    return emptyResponseRetries > 0;
                }
                resetEmptyResponseRetries();
                var initialRetryIndex = function () {
                    return 0;
                };
                var pendingRetryIndex = initialRetryIndex;
                var stopTimeoutBombs = noop;
                function chainTimeoutBombs(timeoutAction, abortAction, intervals, remainingBombsIndex) {
                    var index = remainingBombsIndex();
                    stopTimeoutBombs();
                    function sparkTimeoutBomb() {
                        var run = true;
                        var timeoutBomb = runOnce(Delay(function() {
                            if (run) {
                                var retryCount = intervals.length;
                                if (index < retryCount) {
                                    timeoutAction(++index, retryCount);
                                    stopTimeoutBombs = sparkTimeoutBomb();
                                } else {
                                    abortAction();
                                }
                            }
                        }, intervals[index]));
                        return function() {
                            run = false;
                            stop(timeoutBomb);
                        }
                    }
                    stopTimeoutBombs = sparkTimeoutBomb();
                    return function() {
                        return index;
                    }
                }
                function recalculateRetryIntervals() {
                    return asArray(collect(networkErrorRetryTimeouts, function (factor) {
                        return factor * heartbeatInterval + NetworkDelay;
                    }));
                }
                function networkErrorRetry(i, retries) {
                    warn(logger, 'failed to connect ' + i + ' time' + (i > 1 ? 's' : '') + (i < retries ? ', retrying ...' : ''));
                    broadcast(connectionTroubleListeners);
                    connect();
                }
                function networkFailure() {
                    broadcast(connectionDownListeners);
                }
                function resetTimeoutBomb() {
                    pendingRetryIndex = chainTimeoutBombs(networkErrorRetry, networkFailure, recalculateRetryIntervals(), initialRetryIndex);
                }
                function adjustTimeoutBombIntervals() {
                    pendingRetryIndex = chainTimeoutBombs(networkErrorRetry, networkFailure, recalculateRetryIntervals(), pendingRetryIndex);
                }
                function initializeConnection() {
                    info(logger, 'initialize connection within window ' + namespace.windowID);
                    resetTimeoutBomb();
                    setValue(sequenceNo, Number(getValue(sequenceNo)) + 1);
                    connect();
                }
                var pollingPeriod = 1000;
                var leaseSlot = Slot(ConnectionLease, asString((new Date).getTime()));
                var connectionSlot = Slot(ConnectionRunning);
                function updateLease() {
                    setValue(leaseSlot, (new Date).getTime() + pollingPeriod * 3);
                }
                function isLeaseExpired() {
                    return asNumber(getValue(leaseSlot)) < (new Date).getTime();
                }
                function shouldEstablishBlockingConnection() {
                    return !existsSlot(ConnectionRunning) || isEmpty(getValue(connectionSlot));
                }
                function offerCandidature() {
                    setValue(connectionSlot, windowID);
                }
                function isWinningCandidate() {
                    return startsWith(getValue(connectionSlot), windowID);
                }
                function markAsOwned() {
                    setValue(connectionSlot, windowID + AcquiredMarker);
                }
                function isOwner() {
                    return getValue(connectionSlot) == (windowID + AcquiredMarker);
                }
                function hasOwner() {
                    return endsWith(getValue(connectionSlot), AcquiredMarker);
                }
                function owner() {
                    var owner = getValue(connectionSlot);
                    var i = indexOf(owner, AcquiredMarker);
                    return i > -1 ? substring(owner, 0, i) : owner;
                }
                var lastOwningWindow = '';
                var paused = false;
                var blockingConnectionMonitor = object(function(method) {
                    method(stop, noop);
                });
                function createBlockingConnectionMonitor() {
                    blockingConnectionMonitor = run(Delay(function() {
                        if (shouldEstablishBlockingConnection()) {
                            offerCandidature();
                            info(logger, 'blocking connection not initialized...candidate for its creation');
                        } else {
                            if (isWinningCandidate()) {
                                if (!hasOwner()) {
                                    markAsOwned();
                                    if (notEmpty(registeredPushIds())) {
                                        initializeConnection();
                                    }
                                }
                                updateLease();
                            }
                            if (isLeaseExpired()) {
                                setTimeout(offerCandidature, 1.5 * Math.random() * pollingPeriod);
                                info(logger, 'blocking connection lease expired...candidate for its creation');
                            }
                        }
                        if (isOwner()) {
                            var ids = registeredPushIds();
                            if ((size(ids) != size(lastSentPushIds)) || notEmpty(complement(ids, lastSentPushIds))) {
                                abort(listener);
                                connect();
                            }
                        } else {
                            stopTimeoutBombs();
                            abort(listener);
                        }
                        var currentlyOwningWindow = getValue(connectionSlot);
                        if (hasOwner()) {
                            if (lastOwningWindow != currentlyOwningWindow) {
                                lastOwningWindow = currentlyOwningWindow;
                                broadcast(connectionReEstablished, [ owner() ]);
                            }
                        } else {
                            lastOwningWindow = '';
                        }
                    }, pollingPeriod));
                }
                return object(function(method) {
                    method(onSend, function(self, callback) {
                        append(onSendListeners, callback);
                    });
                    method(onReceive, function(self, callback) {
                        append(onReceiveListeners, callback);
                    });
                    method(onServerError, function(self, callback) {
                        append(onServerErrorListeners, callback);
                    });
                    method(whenDown, function(self, callback) {
                        append(connectionDownListeners, callback);
                    });
                    method(whenTrouble, function(self, callback) {
                        append(connectionTroubleListeners, callback);
                    });
                    method(whenStopped, function(self, callback) {
                        append(connectionStoppedListeners, callback);
                    });
                    method(whenReEstablished, function(self, callback) {
                        append(connectionReEstablished, callback);
                    });
                    method(startConnection, function(self) {
                        createBlockingConnectionMonitor();
                        info(logger, 'connection monitoring started within window ' + namespace.windowID);
                        paused = false;
                    });
                    method(resumeConnection, function(self) {
                        if (paused) {
                            connect = requestForBlockingResponse;
                            initializeConnection();
                            createBlockingConnectionMonitor();
                            paused = false;
                        }
                    });
                    method(pauseConnection, function(self) {
                        if (not(paused)) {
                            abort(listener);
                            stop(blockingConnectionMonitor);
                            stopTimeoutBombs();
                            connect = noop;
                            paused = true;
                            broadcast(connectionStoppedListeners, ['connection stopped']);
                        }
                    });
                    method(reconfigure, function(self, configuration) {
                        setupNetworkErrorRetries(configuration);
                        adjustTimeoutBombIntervals();
                        setupServerErrorRetries(configuration);
                    });
                    method(shutdown, function(self) {
                        try {
                            method(shutdown, noop);
                            connect = noop;
                            resetTimeoutBomb = noop;
                        } catch (e) {
                            error(logger, 'error during shutdown', e);
                        } finally {
                            broadcast(connectionStoppedListeners, ['connection stopped']);
                            onReceiveListeners = connectionDownListeners = onServerErrorListeners = connectionStoppedListeners = [];
                            abort(listener);
                            stopTimeoutBombs();
                            stop(blockingConnectionMonitor);
                            if (isOwner()) {
                                removeSlot(connectionSlot);
                            }
                        }
                    });
                });
            };
        })();
        var notifyWindows = operator();
        var disposeBroadcast = operator();
        function LocalStorageNotificationBroadcaster(name, callback) {
            var RandomSeparator = ':::';
            var PayloadSeparator = '%%%';
            if (!window.localStorage.getItem(name)) {
                window.localStorage.setItem(name, '');
            }
            function storageListener(e) {
                var newValue = e.newValue;
                if (e.key == name && newValue) {
                    var idsAndPayload = split(newValue, RandomSeparator)[0];
                    var tuple = split(idsAndPayload, PayloadSeparator);
                    var ids = split(tuple[0], ' ');
                    var payload = tuple[1];
                    callback(ids, payload);
                }
            }
            if (window.addEventListener) {
                window.addEventListener('storage', storageListener, false);
            } else {
                document.attachEvent('onstorage', storageListener);
            }
            return object(function(method) {
                method(notifyWindows, function(self, ids, payload) {
                    var newValue = join(ids, ' ') + PayloadSeparator + payload;
                    window.localStorage.setItem(name, newValue + RandomSeparator + Math.random());
                    var agent = navigator.userAgent;
                    if (!/MSIE/.test(agent) && !/Trident/.test(agent)) {
                        callback(ids, payload);
                    }
                });
                method(disposeBroadcast, noop);
            });
        }
        function CookieBasedNotificationBroadcaster(name, callback) {
            var NotificationSeparator = ':::';
            var PayloadSeparator = '%%%';
            var notificationsBucket = lookupCookie(name, function() {
                return Cookie(name, '');
            });
            var notificationMonitor = run(Delay(function() {
                try {
                    var unparsedPushIDs = value(notificationsBucket) || '';
                    var notifications = split(unparsedPushIDs, NotificationSeparator);
                    var remainingNotifications = join(inject(notifications, [], function(result, notification) {
                        var tuple = split(notification, PayloadSeparator);
                        var ids = split(tuple[0], ' ');
                        var payload = tuple[1] || '';
                        if (notEmpty(ids)) {
                            var notifiedIDs = callback(ids, payload);
                            var remainingIDs = complement(ids, notifiedIDs);
                            if (notEmpty(remainingIDs)) {
                                append(result, join(notifiedIDs, ' ') + PayloadSeparator + payload);
                            }
                        }
                        return result;
                    }), NotificationSeparator);
                    update(notificationsBucket, remainingNotifications);
                } catch (e) {
                    warn(namespace.logger, 'failed to listen for updates', e);
                }
            }, 300));
            return object(function(method) {
                method(notifyWindows, function(self, receivedPushIDs, payload) {
                    var notifications = asArray(split(value(notificationsBucket), NotificationSeparator));
                    var newNotification = join(receivedPushIDs, ' ') + PayloadSeparator + (payload || '');
                    append(notifications, newNotification);
                    var newNotifications = join(notifications, NotificationSeparator);
                    update(notificationsBucket, newNotifications);
                    if (size(value(notificationsBucket)) != size(newNotifications)) {
                        warn(namespace.logger, 'notifications were dropped because of the cookie size limitation');
                    }
                });
                method(disposeBroadcast, function(self) {
                    stop(notificationMonitor);
                });
            });
        }
        var resumePushIDExpiry = operator();
        var stopPushIDExpiry = operator();
        var PushIDExpiryMonitor;
        (function () {
            if (useLocalStorage()) {
                PushIDExpiryMonitor = function(parentLogger) {
                    var logger = childLogger(parentLogger, 'pushid-expiry');
                    var notificationResponsivness = {};
                    var testChannel = "ice.push.liveliness";
                    var testLivelinessBroadcaster = LocalStorageNotificationBroadcaster(testChannel, function (verifiedIds) {
                        var ids = registeredWindowPushIds();
                        var confirmedIds = intersect(verifiedIds, ids);
                        if (notEmpty(confirmedIds)) {
                            notifyWindows(confirmLivelinessBroadcaster, ids);
                        }
                    });
                    var confirmationChannel = "ice.push.confirm";
                    var confirmLivelinessBroadcaster = LocalStorageNotificationBroadcaster(confirmationChannel, function (confirmedIDs) {
                        each(confirmedIDs, function (id) {
                            delete notificationResponsivness[id];
                        });
                    });
                    function requestConfirmLiveliness() {
                        var ids = registeredPushIds();
                        var discardUnresponsiveIds = [];
                        for (var id in notificationResponsivness) {
                            if (notificationResponsivness.hasOwnProperty(id)) {
                                if (not(contains(ids, id))) {
                                    append(discardUnresponsiveIds, id);
                                }
                            }
                        }
                        each(discardUnresponsiveIds, function (id) {
                            delete notificationResponsivness[id];
                        });
                        each(ids, function (id) {
                            var count = notificationResponsivness[id];
                            if (count) {
                                notificationResponsivness[id] = count + 1;
                            } else {
                                notificationResponsivness[id] = 1;
                            }
                        });
                        if (notEmpty(ids)) {
                            notifyWindows(testLivelinessBroadcaster, ids);
                        }
                        return notificationResponsivness;
                    }
                    function removeUnusedPushIDs() {
                        var unresponsivePushIds = requestConfirmLiveliness();
                        var ids = [];
                        for (var p in unresponsivePushIds) {
                            if (unresponsivePushIds.hasOwnProperty(p) && unresponsivePushIds[p] > 5) {
                                append(ids, p);
                            }
                        }
                        if (notEmpty(ids)) {
                            info(logger, 'expirying unused pushIDs: ' + ids);
                            delistPushIDsWithBrowser(ids);
                        }
                    }
                    var pid = object(function (method) {
                        method(stop, noop);
                    });
                    return object(function (method) {
                        method(resumePushIDExpiry, function (self) {
                            info(logger, 'resume monitoring for unused pushIDs');
                            pid = Delay(removeUnusedPushIDs, 10000);
                            run(pid);
                        });
                        method(stopPushIDExpiry, function (self) {
                            info(logger, 'stopped monitoring for unused pushIDs');
                            stop(pid);
                        });
                    });
                };
            } else {
                PushIDExpiryMonitor = function () {
                    return object(function (method) {
                        method(resumePushIDExpiry, noop);
                        method(stopPushIDExpiry, noop);
                    });
                };
            }
        })();
        var notificationListeners = [];
        namespace.onNotification = function (callback) {
            append(notificationListeners, callback);
            return removeCallbackCallback(notificationListeners, detectByReference(callback));
        };
        var receiveListeners = [];
        namespace.onBlockingConnectionReceive = function (callback) {
            append(receiveListeners, callback);
            return removeCallbackCallback(receiveListeners, detectByReference(callback));
        };
        var serverErrorListeners = [];
        namespace.onBlockingConnectionServerError = function (callback) {
            append(serverErrorListeners, callback);
            return removeCallbackCallback(serverErrorListeners, detectByReference(callback));
        };
        var blockingConnectionUnstableListeners = [];
        namespace.onBlockingConnectionUnstable = function (callback) {
            append(blockingConnectionUnstableListeners, callback);
            return removeCallbackCallback(blockingConnectionUnstableListeners, detectByReference(callback));
        };
        var blockingConnectionLostListeners = [];
        namespace.onBlockingConnectionLost = function (callback) {
            append(blockingConnectionLostListeners, callback);
            return removeCallbackCallback(blockingConnectionLostListeners, detectByReference(callback));
        };
        var blockingConnectionReEstablishedListeners = [];
        namespace.onBlockingConnectionReEstablished = function (callback) {
            append(blockingConnectionReEstablishedListeners, callback);
            return removeCallbackCallback(blockingConnectionReEstablishedListeners, detectByReference(callback));
        };
        var PushID = 'ice.pushid';
        var PushIDs = 'ice.pushids';
        var BrowserIDName = 'ice.push.browser';
        var WindowID = 'ice.push.window';
        var NotifiedPushIDs = 'ice.notified.pushids';
        var HeartbeatTimestamp = 'ice.push.heartbeatTimestamp';
        var handler = LocalStorageLogHandler(window.console ? ConsoleLogHandler(debug) : WindowLogHandler(debug, window.location.href));
        namespace.windowID = namespace.windowID || substring(Math.random().toString(16), 2, 7);
        namespace.logger = Logger(['icepush'], handler);
        namespace.info = info;
        var pushIdentifiers = [];
        function registeredWindowPushIds() {
            return pushIdentifiers;
        }
        var pushIDsSlot = Slot(PushIDs);
        function registeredPushIds() {
            try {
                return split(getValue(pushIDsSlot), ' ');
            } catch (e) {
                return [];
            }
        }
        function enlistPushIDsWithBrowser(ids) {
            var registeredIDs = split(getValue(pushIDsSlot), ' ');
            try {
                lookupCookieValue(BrowserIDName)
            } catch (ex) {
                try {
                    var id = ids[0].split(':')[0];
                    Cookie(BrowserIDName, id);
                } catch (ex) {
                    error(namespace.logger, 'Failed to extract browser ID from push ID.');
                }
            }
            setValue(pushIDsSlot, join(asSet(concatenate(registeredIDs, ids)), ' '));
        }
        function delistPushIDsWithBrowser(ids) {
            if (existsSlot(PushIDs)) {
                var registeredIDs = split(getValue(pushIDsSlot), ' ');
                setValue(pushIDsSlot, join(complement(registeredIDs, ids), ' '));
            }
        }
        function enlistPushIDsWithWindow(ids) {
            enlistPushIDsWithBrowser(ids);
            pushIdentifiers = concatenate(pushIdentifiers, ids);
        }
        function delistPushIDsWithWindow(ids) {
            delistPushIDsWithBrowser(ids);
            pushIdentifiers = complement(pushIdentifiers, ids);
        }
        function throwServerError(response) {
            throw 'Server internal error: ' + contentAsText(response);
        }
        function isJSONResponse(response) {
            var mimeType = getHeader(response, 'Content-Type');
            return mimeType && startsWith(mimeType, 'application/json');
        }
        function JSONRequest(request) {
            setHeader(request, 'Content-Type', 'application/json');
        }
        function browserID() {
            try {
                return lookupCookieValue(BrowserIDName);
            } catch (e) {
                return null;
            }
        }
        var commandDispatcher = CommandDispatcher();
        register(commandDispatcher, 'error', CommandError);
        namespace.setupPush = function(configuration, onStartup, onShutdown) {
            var apiChannel = Client(true);
            var API = {
                register: function (pushIds, callback) {
                    if ((typeof callback) == 'function') {
                        enlistPushIDsWithWindow(pushIds);
                        namespace.onNotification(function (ids, payload) {
                            var currentNotifications = asArray(intersect(ids, pushIds));
                            if (notEmpty(currentNotifications)) {
                                try {
                                    callback(currentNotifications, payload);
                                } catch (e) {
                                    error(namespace.logger, 'error thrown by push notification callback', e);
                                }
                            }
                        });
                    } else {
                        throw 'the callback is not a function';
                    }
                },
                deregister: delistPushIDsWithWindow,
                createPushId: function createPushId(callback, pushIdTimeout, cloudPushIdTimeout, retries) {
                    var uri = configuration.uri + voyent.auth.getLastKnownAccount() + '/realms/' + voyent.auth.getLastKnownRealm() + '/push-ids?access_token=' + encodeURIComponent(voyent.auth.getLastAccessToken());
                    retries = retries == null ? 3 : retries;
                    var parameters = {
                        'access_token': voyent.auth.getLastAccessToken(),
                        'browser':  browserID(),
                        'op': 'create'
                    };
                    if (pushIdTimeout) {
                        parameters.push_id_timeout = pushIdTimeout
                    }
                    if (cloudPushIdTimeout) {
                        parameters.cloud_push_id_timeout = cloudPushIdTimeout
                    }
                    var body = JSON.stringify(parameters);
                    postAsynchronously(apiChannel, uri, body, JSONRequest, $witch(function (condition) {
                        condition(CREATED, function (response) {
                            if (isJSONResponse(response)) {
                                var content = contentAsText(response);
                                var result = JSON.parse(content);
                                callback(result.push_id);
                            } else {
                                if (retries && retries > 1) {
                                    error(namespace.logger, 'failed to set ice.push.browser cookie');
                                    return;
                                }
                                deserializeAndExecute(commandDispatcher, contentAsText(response));
                                retries = retries ? retries + 1 : 1;
                                createPushId(retries, callback);
                            }
                        });
                        condition(ServerInternalError, throwServerError);
                    }));
                },
                deletePushId: function (id, resultCallback) {
                    var uri = configuration.uri + voyent.auth.getLastKnownAccount() + '/realms/' + voyent.auth.getLastKnownRealm() + '/push-ids/' + encodeURIComponent(id);
                    deleteAsynchronously(apiChannel, uri, function (query) {
                        addNameValue(query, "access_token", voyent.auth.getLastAccessToken());
                    }, JSONRequest, $witch(function (condition) {
                        condition(NOCONTENT, resultCallback || noop);
                        condition(ServerInternalError, throwServerError);
                    }));
                },
                getConfiguration: function (callback) {
                    var uri = configuration.uri + voyent.auth.getLastKnownAccount() + '/realms/' + voyent.auth.getLastKnownRealm() + '/configuration';
                    getAsynchronously(apiChannel, uri, function (query) {
                        addNameValue(query, "access_token", voyent.auth.getLastAccessToken());
                        addNameValue(query, "op", "get");
                    }, JSONRequest, $witch(function (condition) {
                        condition(OK, function (response) {
                            try {
                                deserializeAndExecute(commandDispatcher, contentAsText(response));
                            } finally {
                                callback();
                            }
                        });
                        condition(ServerInternalError, throwServerError);
                    }));
                },
                notify: function (group, options) {
                    var uri = configuration.uri + voyent.auth.getLastKnownAccount() + '/realms/' + voyent.auth.getLastKnownRealm() + '/groups/' + group + '?access_token=' + encodeURIComponent(voyent.auth.getLastAccessToken()) + '&op=push';
                    var body = JSON.stringify({
                        'access_token': voyent.auth.getLastAccessToken(),
                        'browser': browserID(),
                        'op': 'push',
                        'push_configuration': options
                    });
                    postAsynchronously(apiChannel, uri, body, JSONRequest, $witch(function (condition) {
                        condition(ServerInternalError, throwServerError);
                    }));
                },
                addGroupMember: function (group, id, cloudEnabled, resultCallback) {
                    var uri = configuration.uri + voyent.auth.getLastKnownAccount() + '/realms/' + voyent.auth.getLastKnownRealm() + '/groups/' + group + '/push-ids/' + id + '?access_token=' + encodeURIComponent(voyent.auth.getLastAccessToken()) + '&op=add';
                    var parameters = {
                        'access_token': voyent.auth.getLastAccessToken(),
                        'browser': browserID(),
                        'op': 'add'
                    };
                    if (cloudEnabled) {
                        parameters.push_configuration = {
                            'cloud_notification_enabled': true
                        }
                    }
                    var body = JSON.stringify(parameters);
                    postAsynchronously(apiChannel, uri, body, JSONRequest, $witch(function (condition) {
                        condition(NOCONTENT, resultCallback || noop);
                        condition(ServerInternalError, throwServerError);
                    }));
                },
                removeGroupMember: function (group, id, resultCallback) {
                    var uri = configuration.uri + voyent.auth.getLastKnownAccount() + '/realms/' + voyent.auth.getLastKnownRealm() + '/groups/' + group + '/push-ids/' + id;
                    deleteAsynchronously(apiChannel, uri, function (query) {
                        addNameValue(query, "access_token", voyent.auth.getLastAccessToken());
                        addNameValue(query, "op", "delete");
                    }, JSONRequest, $witch(function (condition) {
                        condition(NOCONTENT, resultCallback || noop);
                        condition(ServerInternalError, throwServerError);
                    }));
                },
                addNotifyBackURI: function (notifyBackURI, resultCallback) {
                    var uri = configuration.uri + voyent.auth.getLastKnownAccount() + '/realms/' + voyent.auth.getLastKnownRealm() + '/browsers/' + browserID() + '/notify-back-uris/' + notifyBackURI + '?access_token=' + encodeURIComponent(voyent.auth.getLastAccessToken()) + '&op=add';
                    var body = JSON.stringify({
                        'access_token': voyent.auth.getLastAccessToken(),
                        'browser': browserID(),
                        'op': 'add'
                    });
                    postAsynchronously(apiChannel, uri, body, JSONRequest, $witch(function (condition) {
                        condition(NOCONTENT, resultCallback || noop);
                        condition(ServerInternalError, throwServerError);
                    }));
                },
                removeNotifyBackURI: function (resultCallback) {
                    var uri = configuration.uri + voyent.auth.getLastKnownAccount() + '/realms/' + voyent.auth.getLastKnownRealm() + '/browsers/' + browserID() + '/notify-back-uris';
                    deleteAsynchronously(apiChannel, uri, function (query) {
                        addNameValue(query, "access_token", voyent.auth.getLastAccessToken());
                        addNameValue(query, "op", "remove");
                    }, JSONRequest, $witch(function (condition) {
                        condition(NOCONTENT, resultCallback || noop);
                        condition(ServerInternalError, throwServerError);
                    }));
                },
                hasNotifyBackURI: function (resultCallback) {
                    var uri = configuration.uri + voyent.auth.getLastKnownAccount() + '/realms/' + voyent.auth.getLastKnownRealm() + '/browsers/' + browserID() + '/notify-back-uris';
                    getAsynchronously(apiChannel, uri, function (query) {
                        addNameValue(query, "access_token", voyent.auth.getLastAccessToken());
                        addNameValue(query, "op", "has");
                    }, JSONRequest, $witch(function (condition) {
                        condition(NOCONTENT, function (response) {
                            resultCallback(true);
                        });
                        condition(NOTFOUND, function (response) {
                            resultCallback(false);
                        });
                        condition(ServerInternalError, throwServerError);
                    }));
                }
            };
            Bridge(configuration, API, onStartup, onShutdown);
            onKeyPress(document, function(ev) {
                var e = $event(ev);
                if (isEscKey(e)) cancelDefaultAction(e);
            });
            return API;
        };
        function Bridge(configuration, pushAPI, onStartup, onShutdown) {
            var windowID = namespace.windowID;
            var logger = childLogger(namespace.logger, windowID);
            var pushIdExpiryMonitor = PushIDExpiryMonitor(logger);
            var asyncConnection = AsyncConnection(logger, windowID, configuration);
            pushAPI.connection = {
                pauseConnection: function() {
                    pauseConnection(asyncConnection);
                },
                resumeConnection: function() {
                    resumeConnection(asyncConnection);
                }
            };
            function purgeNonRegisteredPushIDs(ids) {
                var registeredIDs = split(getValue(pushIDsSlot), ' ');
                return intersect(ids, registeredIDs);
            }
            function selectWindowNotifications(ids, payload) {
                try {
                    var windowPushIDs = asArray(intersect(ids, pushIdentifiers));
                    if (notEmpty(windowPushIDs)) {
                        broadcast(notificationListeners, [ windowPushIDs, payload ]);
                        if (payload) {
                            debug(logger, "picked up notifications with payload '" + payload + "' for this window: " + windowPushIDs);
                        } else {
                            debug(logger, "picked up notifications for this window: " + windowPushIDs);
                        }
                        return windowPushIDs;
                    } else {
                        return [];
                    }
                } catch (e) {
                    warn(logger, 'failed to listen for updates', e);
                    return [];
                }
            }
            var notificationBroadcaster = useLocalStorage() ?
                LocalStorageNotificationBroadcaster(NotifiedPushIDs, selectWindowNotifications) : CookieBasedNotificationBroadcaster(NotifiedPushIDs, selectWindowNotifications);
            register(commandDispatcher, 'notifications', function(notifications) {
                each(notifications, function(notification) {
                    var ids = notification['push-ids'];
                    notifyWindows(notificationBroadcaster, purgeNonRegisteredPushIDs(asSet(ids)), notification['payload']);
                });
            });
            register(commandDispatcher, 'noop', function() {
                debug(logger, 'received noop');
            });
            register(commandDispatcher, 'configuration', function(configuration) {
                debug(logger, 'received configuration');
                reconfigure(asyncConnection, configuration);
            });
            register(commandDispatcher, 'browser', function(browserID) {
                debug(logger, 'received browser ID');
                Cookie(BrowserIDName, browserID);
            });
            register(commandDispatcher, 'back-off', function(delay) {
                debug(logger, 'received back-off');
                try {
                    pauseConnection(asyncConnection);
                } finally {
                    runOnce(Delay(function() {
                        resumeConnection(asyncConnection);
                    }, delay));
                }
            });
            function dispose() {
                try {
                    info(logger, 'shutting down bridge...');
                    dispose = noop;
                    disposeBroadcast(notificationBroadcaster);
                } finally {
                    shutdown(asyncConnection);
                    if (onShutdown) {
                        onShutdown();
                    }
                }
            }
            onBeforeUnload(window, function() {
                pauseConnection(asyncConnection);
            });
            onUnload(window, dispose);
            onSend(asyncConnection, function(query) {
                if (heartbeatTimestamp) {
                    parameter(query, HeartbeatTimestamp, heartbeatTimestamp);
                }
            });
            onReceive(asyncConnection, function(response) {
                if (isJSONResponse(response)) {
                    var content = contentAsText(response);
                    deserializeAndExecute(commandDispatcher, content);
                    broadcast(receiveListeners, [ content ]);
                } else {
                    var mimeType = getHeader(response, 'Content-Type');
                    warn(logger, 'unknown content in response - ' + mimeType + ', expected text/xml');
                    dispose();
                }
            });
            onServerError(asyncConnection, function(response) {
                try {
                    warn(logger, 'server side error');
                    broadcast(serverErrorListeners, [ statusCode(response), contentAsText(response)]);
                } finally {
                    dispose();
                }
            });
            whenStopped(asyncConnection, function(reason) {
                debug(logger, reason + ' in window [' + windowID + ']');
                stopPushIDExpiry(pushIdExpiryMonitor);
            });
            whenReEstablished(asyncConnection, function(windowID) {
                broadcast(blockingConnectionReEstablishedListeners);
                (windowID == namespace.windowID ? resumePushIDExpiry : stopPushIDExpiry)(pushIdExpiryMonitor);
            });
            whenDown(asyncConnection, function(reconnectAttempts) {
                try {
                    warn(logger, 'connection to server was lost');
                    broadcast(blockingConnectionLostListeners, [ reconnectAttempts ]);
                } finally {
                    dispose();
                }
            });
            whenTrouble(asyncConnection, function() {
                warn(logger, 'connection in trouble');
                broadcast(blockingConnectionUnstableListeners);
            });
            info(logger, 'bridge loaded!');
            function finishStartup() {
                startConnection(asyncConnection);
                if (onStartup) {
                    onStartup();
                }
            }
            if (configuration.configuration && existsCookie(BrowserIDName)) {
                finishStartup();
            } else {
                pushAPI.getConfiguration(finishStartup);
            }
        }
    })(window.ice);
}
function AuthService(v, keys, utils) {

    var authKeys = {
        PASSWORD_KEY: 'voyentPassword',
        SCOPE_TO_PATH_KEY: "voyentScopeToPath",
        CONNECT_SETTINGS_KEY: 'voyentConnectSettings',
        RELOGIN_CB_KEY: 'voyentReloginCallback',
        LAST_ACTIVE_TS_KEY: 'voyentLastActiveTimestamp',
        COMPUTER_SLEEP_CB_KEY: 'voyentComputerSleepCallback',
    };

    function validateAndReturnRequiredRole(params, reject){
        var role = params.role;
        if( role ){
            return role;
        }
        else{
            return reject(Error('The Voyent role parameter is required'));
        }
    }

    function validateAndReturnRequiredRoles(params, reject){
        var roles = params.roles;
        if( roles ){
            return roles;
        }
        else{
            return reject(Error('The Voyent roles parameter is required'));
        }
    }

    function fireEvent(el, eventName, detail) {
        var event;
        if ('CustomEvent' in window) {
            event = new CustomEvent(eventName, {'detail': detail});
        }
        else if (document.createEvent) {//IE 10 & other older browsers
            event = document.createEvent('HTMLEvents');
            event.initEvent(eventName, true, true);
        }
        else if (document.createEventObject) {// IE < 9
            event = document.createEventObject();
            event.eventType = eventName;
        }
        event.eventName = eventName;
        if (el.dispatchEvent) {
            el.dispatchEvent(event);
        } else if (el.fireEvent && htmlEvents['on' + eventName]) {// IE < 9
            el.fireEvent('on' + event.eventType, event);// can trigger only real event (e.g. 'click')
        } else if (el[eventName]) {
            el[eventName]();
        } else if (el['on' + eventName]) {
            el['on' + eventName]();
        }
    }

    return {

        /**
         * Retrieve a new access token from the Voyent auth service.
         *
         * The function returns a Promise that, when successful, returns an object with the following structure:
         *    {
		 *       "access_token": "d9f7463d-d100-42b6-aecd-ae21e38e5d02",
		 *       "expires_in": 1420574793844
		 *    }
         *
         * Which contains the access token and the time, in milliseconds that the session will expire in.
         *
         * Unlike the login, and connect functions, this function does not store the access token after it
         * is retrieved.
         *
         * @memberOf voyent.auth
         * @alias getNewAccessToken
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name (required)
         * @param {String} params.realm Voyent Services realm (required only for non-admin logins)
         * @param {String} params.username User name (required)
         * @param {String} params.password User password (required)
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {Promise} with the following argument:
         *      {
		 *          access_token: 'xxx',
		 *          expires_in: 99999
		 *      }
         *
         */
        getNewAccessToken: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    if (!params.realm) {
                        params.realm = 'admin';
                    }

                    //validation
                    if (!params.account) {
                        reject(Error('Voyent account required for new access token'));
                        return;
                    }
                    if (!params.password) {
                        reject(Error('password required for new access token'));
                        return;
                    }
                    if (!params.username) {
                        reject(Error('username required for new access token'));
                        return;
                    }
                    var url = v.authURL + '/' + encodeURI(params.account) +
                        '/realms/' + encodeURI(params.realm) + '/token/?' + utils.getTransactionURLParam();

                    v.$.post(url, {
                        strategy: 'query',
                        username: params.username,
                        password: params.password
                    }).then(function (authResponse) {
                        resolve(authResponse);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Login into voyent.
         *
         * This function will login into the Voyent auth service and return a user token and expiry timestamp upon
         * successful authentication. This function does not need to be called if v.connect has already been
         * called, as that function will automatically extend the user session, unless the timeout has passed.
         *
         * The function returns a Promise that, when successful, returns an object with the following structure:
         *    {
		 *       "access_token": "d9f7463d-d100-42b6-aecd-ae21e38e5d02",
		 *       "expires_in": 1420574793844
		 *    }
         *
         * Which contains the access token and the time, in milliseconds that the session will expire in.
         *
         * @memberOf voyent.auth
         * @alias login
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name (required)
         * @param {String} params.realm Voyent Services realm (required only for non-admin logins)
         * @param {Boolean} params.admin The client should or should not log in as an account administrator
         * @param {String} params.username User name (required)
         * @param {String} params.password User password (required)
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {String} params.scopeToPath (default '/') If set, the authentication token will be restricted to the
         *     given path, unless on localhost.
         * @returns {Promise} with the following argument:
         *      {
		 *          access_token: 'xxx',
		 *          expires_in: 99999
		 *      }
         *
         */
        login: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                if (!params.realm) {
                    params.realm = 'admin';
                }

                //validation
                if (!params.account) {
                    reject(Error('Voyent account required for login'));
                    return;
                }
                if (!params.password) {
                    reject(Error('password required for login'));
                    return;
                }
                if (!params.username) {
                    reject(Error('username required for login'));
                    return;
                }
                var txParam = utils.getTransactionURLParam();
                var url = v.authURL + '/' + encodeURI(params.account) +
                    '/realms/' + (params.admin === 'true' ? 'admin' : encodeURI(params.realm)) + '/token/' + ( txParam ? ('?' + txParam) : '');

                var loggedInAt = new Date().getTime();
                v.$.post(url, {
                    strategy: 'query',
                    username: params.username,
                    password: params.password
                }).then(function (authResponse) {
                    if (!params.suppressUpdateTimestamp) {
                        v.auth.updateLastActiveTimestamp();
                    }
                    utils.setSessionStorageItem(btoa(keys.TOKEN_KEY), authResponse.access_token);
                    utils.setSessionStorageItem(btoa(keys.TOKEN_EXPIRES_KEY), authResponse.expires_in);
                    utils.setSessionStorageItem(btoa(keys.TOKEN_SET_KEY), loggedInAt);
                    utils.setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(params.account));
                    if (params.host) {
                        utils.setSessionStorageItem(btoa(keys.HOST_KEY), btoa(params.host));
                    }
                    utils.setSessionStorageItem(btoa(keys.REALM_KEY), btoa(params.realm));
                    utils.setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(params.username));
                    utils.setSessionStorageItem(btoa(keys.ADMIN_KEY), btoa(params.admin));
                    if (params.scopeToPath) {
                        utils.setSessionStorageItem(btoa(authKeys.SCOPE_TO_PATH_KEY), btoa(params.scopeToPath));
                    }
                    fireEvent(window, 'voyent-login-succeeded', {});
                    resolve(authResponse);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
        
        /**
         * Store various login variables from an external source
         *
         * @memberOf voyent.auth
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name (required)
         * @param {String} params.realm Voyent Services realm (required)
         * @param {String} params.username User name (required)
         * @param {String} params.access_token Valid access token (required)
         * @param {String} params.expires_in Token expiry, in milliseconds (required)
         */
        _storeLogin: function(params) {
            if (!params.access_token) {
                reject(Error('Voyent access token is required'));
                return;
            }
            if (!params.expires_in) {
                reject(Error('Voyent access token expiry is required'));
                return;
            }
            if (!params.account) {
                reject(Error('Voyent account is required'));
                return;
            }
            if (!params.realm) {
                reject(Error('Voyent realm is required'));
                return;
            }
            if (!params.username) {
                reject(Error('Voyent username is required'));
                return;
            }
            
            v.auth.updateLastActiveTimestamp();
            utils.setSessionStorageItem(btoa(keys.TOKEN_KEY), params.access_token);
            utils.setSessionStorageItem(btoa(keys.TOKEN_EXPIRES_KEY), params.expires_in);
            utils.setSessionStorageItem(btoa(keys.TOKEN_SET_KEY), new Date().getTime());
            utils.setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(params.account));
            utils.setSessionStorageItem(btoa(keys.REALM_KEY), btoa(params.realm));
            utils.setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(params.username));
        },

        /**
         * Connect to voyent.
         *
         * This function will connect to the Voyent voyent, and maintain the connection for the specified
         * timeout period (default 20 minutes). By default, the Voyent push service is also activated, so the client
         * may send and receive push notifications after connecting.
         *
         * After connecting to Voyent Services, any Voyent service API may be used without needing to re-authenticate.
         * After successfully connecting an authentication will be stored in session storage and available through
         * sessionStorage.voyentToken. This authentication information will automatically be used by other Voyent API
         * calls, so the token does not be included in subsequent calls, but is available if desired.
         *
         * A simple example of connecting to the Voyent Services and then making a service call is the following:
         * @example
         * v.connect({
		 *           account: 'my_account',
		 *           realm: 'realmA',
		 *           user: 'user',
		 *           password: 'secret'})
         *   .then( function(){
		 *      console.log("successfully connnected to Voyent Services");
		 *   })
         *   .then( function(docs){
		 *      for( var d in docs ){ ... };
		 *   })
         *   .catch( function(error){
		 *      console.log("error connecting to Voyent Services: " + error);
		 *   });
         *
         * @memberOf voyent.auth
         * @alias connect
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name
         * @param {Boolean} params.admin The client should or should not log in as an account administrator
         * @param {String} params.realm Voyent Services realm
         * @param {String} params.username User name
         * @param {String} params.password User password
         * @param {String} params.host The Voyent Services host url, defaults to api.voyent.cloud
         * @param {Boolean} params.usePushService Open and connect to the Voyent push service, default true
         * @param {Boolean} params.connectionTimeout The timeout duration, in minutes, that the Voyent login will last
         *     during inactivity. Default 20 minutes.
         * @param {Boolean} params.storeCredentials (default true) Whether to store encrypted credentials in session
         *     storage. If set to false, voyent will not attempt to relogin before the session expires.
         * @param {Function} params.onSessionExpiry Function callback to be called on session expiry. If you wish to
         *     ensure that disconnect is not called until after your onSessionExpiry callback has completed, please
         *     return a Promise from your function.
         * @param {String} params.scopeToPath (default '/') If set, the authentication token will be restricted to the
         *     given path, unless on localhost.
         * @returns Promise with service definitions
         *
         */
        connect: function (params) {
            return new Promise(function (resolve, reject) {

                function startTokenExpiryTimer(timeout) {
                    var tokenSetAt = new Date();
                    tokenSetAt.setTime(v.auth.getTokenSetAtTime());

                    var connectTimeoutCb = setTimeout(connectCallback, timeout);
                    utils.setSessionStorageItem(btoa(authKeys.RELOGIN_CB_KEY), connectTimeoutCb);

                    console.log(new Date().toISOString() + ' voyent.auth.connect: setting next connection check to ' + timeout / 1000 / 60 + ' mins, expiresIn: ' +
                        (v.auth.getExpiresIn() / 1000 / 60) + ' mins, remaining: ' +
                        (v.auth.getTimeRemainingBeforeExpiry() / 1000 / 60) + ' mins, token set at ' + tokenSetAt);

                    // When the computer is put to sleep our timer for the access_token refresh is no longer valid
                    // since it will pause during sleep and then continue execution from where it left off once awake.
                    // We will try and detect if the computer has been sleeping by using a continuously running
                    // setInterval. If it takes longer than expected for the setInterval to execute then we will assume
                    // that the computer has been sleeping and try to refresh the token.

                    // First check if we already have a sleep timer running and if so clear it
                    var compSleepIntervalCb = utils.getSessionStorageItem(btoa(authKeys.COMPUTER_SLEEP_CB_KEY));
                    if (compSleepIntervalCb) {
                        clearInterval(compSleepIntervalCb);
                    }
                    var sleepTimeout = 10000; // Run the sleep timer every 10 seconds so it will detect sleep shortly after awakening
                    var lastCheckedTime = (new Date()).getTime();
                    var computerSleepTimer = setInterval(function() {
                        var currentTime = (new Date()).getTime();
                        var timerPadding = 2500; // Set a 2.5 second buffer for the timeout as setInterval does not guarantee exact timing
                        var nextExpectedTime = lastCheckedTime + sleepTimeout + timerPadding;
                        if (currentTime > (nextExpectedTime)) {
                            // Clear the old token timer since it is not valid after computer sleep
                            var oldConnectTimeoutCb = utils.getSessionStorageItem(btoa(authKeys.RELOGIN_CB_KEY), connectTimeoutCb);
                            if (oldConnectTimeoutCb) {
                                clearTimeout(oldConnectTimeoutCb);
                                utils.removeSessionStorageItem(btoa(authKeys.RELOGIN_CB_KEY));
                            }
                            // Try and refresh the token
                            v.auth.refreshAccessToken().then(function () {
                                startTokenExpiryTimer(v.auth.getExpiresIn() - timeoutPadding);
                            }).catch(function(e) {});
                        }
                        lastCheckedTime = currentTime;
                    }, sleepTimeout);
                    utils.setSessionStorageItem(btoa(authKeys.COMPUTER_SLEEP_CB_KEY), computerSleepTimer);
                }

                /* The function callback set to run before the next timeout,
                 will automatically reset the next setTimeout call if necessary */
                function connectCallback() {
                    console.log(new Date().toISOString() + ' voyent.auth.connect: callback running');
                    var connectSettings = v.auth.getConnectSettings();
                    if (!connectSettings) {
                        console.log(new Date().toISOString() + ' voyent.auth.connect: error, could not retrieve settings');
                        return;
                    }

                    var timeoutMillis = connectSettings.connectionTimeout * 60 * 1000;

                    //first check if connectionTimeout has expired
                    var now = new Date().getTime();
                    var inactiveMillis = now - v.auth.getLastActiveTimestamp();
                    var millisUntilTimeoutExpires = timeoutMillis - inactiveMillis;
                    console.log('voyent.auth.connect: getLastActiveTimestamp: ' + v.auth.getLastActiveTimestamp());
                    console.log('voyent.auth.connect: connection timeout ms: ' + timeoutMillis);
                    console.log('voyent.auth.connect: current timestamp: ' + now);
                    console.log('voyent.auth.connect: inactive ms: ' + inactiveMillis + '(' + (inactiveMillis / 1000 / 60) + ' mins)');
                    console.log('voyent.auth.connect: ms until timeout: ' + millisUntilTimeoutExpires + '(' + (millisUntilTimeoutExpires / 1000 / 60) + ' mins)');

                    //if we haven't exceeded the connection timeout, reconnect
                    if (millisUntilTimeoutExpires > 0) {
                        console.log(new Date().toISOString() + ' voyent.auth.connect: timeout has not been exceeded, ' +
                            v.auth.getTimeRemainingBeforeExpiry() / 1000 / 60 + ' mins remaining before token expires, ' +
                            millisUntilTimeoutExpires / 1000 / 60 + ' mins remaining before timeout expires');

                        //if we the time remaining before expiry is less than the session timeout
                        //refresh the access token and set the timeout
                        if (timeoutMillis > millisUntilTimeoutExpires) {
                            v.auth.refreshAccessToken().then(function () {
                                startTokenExpiryTimer(v.auth.getExpiresIn() - timeoutPadding);
                            }).catch(function(e) {});
                        }
                    } else {
                        console.log(new Date().toISOString() + ' voyent.auth.connect: timeout has expired, disconnecting..');

                        //look for the onSessionExpiry callback on the params first,
                        //as functions could be passed by reference
                        //secondly by settings, which would only be passed by name
                        var expiredCallback = params.onSessionExpiry;
                        if (!expiredCallback) {
                            expiredCallback = connectSettings.onSessionExpiry;
                        }

                        //if there's no onSessionExpiry, call disconnect immediately
                        //otherwise search for onSessionExpiry function, if not found
                        //call disconnect() immediately, otherwise call onSessionExpiry
                        //if callback if a promise, wait until the promise completes
                        //before disconnecting, otherwise, wait 500ms then disconnect
                        if (expiredCallback) {
                            var expiredCallbackFunction;
                            if (typeof expiredCallback === 'function') {
                                expiredCallbackFunction = expiredCallback;
                            }
                            else if (typeof expiredCallback === 'string') {
                                expiredCallbackFunction = utils.findFunctionInGlobalScope(expiredCallback);
                            }
                            if (expiredCallbackFunction) {
                                var expiredCallbackPromise = expiredCallbackFunction();
                                if (expiredCallbackPromise && expiredCallbackPromise.then) {
                                    expiredCallbackPromise.then(v.auth.disconnect)
                                        ['catch'](v.auth.disconnect);
                                }
                                else {
                                    setTimeout(v.auth.disconnect, 500);
                                }
                            }
                            else {
                                console.log(new Date().toISOString() + ' voyent.auth.connect: error calling onSessionExpiry callback, ' +
                                    'could not find function: ' + expiredCallback);
                                v.auth.disconnect();
                            }

                        }
                        else {
                            v.auth.disconnect();
                        }

                    }
                }

                /* initialize the timing for the callback check */
                function initConnectCallback() {

                    //if the desired connection timeout is greater the token expiry
                    //set the callback check for just before the token expires
                    var callbackTimeout;
                    if (connectionTimeoutMillis > v.auth.getTimeRemainingBeforeExpiry()) {
                        callbackTimeout = v.auth.getTimeRemainingBeforeExpiry() - timeoutPadding;
                    }
                    //otherwise the disired timeout is less then the token expiry
                    //so set the callback to happen just at specified timeout
                    else {
                        callbackTimeout = connectionTimeoutMillis;
                    }

                    startTokenExpiryTimer(callbackTimeout);

                    if (settings.usePushService) {
                        // v.push.startPushService(settings);
                    }
                    v.auth.connected = true;
                }

                /* initialize basic settings */
                function initSettings() {

                    params = params ? params : {};
                    if (!params.storeCredentials) {
                        params.storeCredentials = true;
                    }

                    //store connect settings
                    settings = {
                        host: v.baseURL,
                        usePushService: params.usePushService,
                        connectionTimeout: params.connectionTimeout || 20,
                        ssl: params.ssl,
                        storeCredentials: params.storeCredentials || true,
                        onSessionExpiry: params.onSessionExpiry,
                        admin: params.admin
                    };
                    if (params.scopeToPath) {
                        settings.scopeToPath = params.scopeToPath;
                    }

                    //settings.connectionTimeout = 5;

                    utils.setSessionStorageItem(btoa(authKeys.CONNECT_SETTINGS_KEY), btoa(JSON.stringify(settings)));

                    if (params.onSessionExpiry) {
                        if (typeof params.onSessionExpiry === 'function') {
                            var name = utils.getFunctionName(params.onSessionExpiry);
                            if (name) {
                                settings.onSessionExpiry = name;
                            }
                        }
                    }


                    connectionTimeoutMillis = (settings.connectionTimeout) * 60 * 1000;

                }

                /* store the provided credentials */
                function saveCredentials() {
                    utils.setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(v.auth.getLastKnownAccount()));
                    utils.setSessionStorageItem(btoa(keys.REALM_KEY), btoa(v.auth.getLastKnownRealm()));
                    utils.setSessionStorageItem(btoa(keys.HOST_KEY), btoa(v.auth.getLastKnownHost()));
                    utils.setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(params.username));
                    utils.setSessionStorageItem(btoa(authKeys.PASSWORD_KEY), btoa(params.password));
                }

                var timeoutPadding = 60000;
                var settings;
                var connectionTimeoutMillis;
                initSettings();

                if (v.auth.isLoggedIn()) {
                    initConnectCallback();
                    resolve();
                }
                else {
                    v.auth.login(params).then(function (authResponse) {
                        console.log(new Date().toISOString() + ' voyent.auth.connect: received auth response');
                        saveCredentials();
                        initConnectCallback();
                        resolve(authResponse);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            });
        },

        refreshAccessToken: function (isRetryAttempt) {
            return new Promise(function (resolve, reject) {
                if (!v.auth.isLoggedIn()) {
                    fireEvent(window, 'voyent-access-token-refresh-failed', {});
                    reject('voyent.auth.refreshAccessToken() not logged in, cant refresh token');
                }
                else {
                    var loginParams = v.auth.getConnectSettings();
                    if (!loginParams) {
                        fireEvent(window, 'voyent-access-token-refresh-failed', {});
                        reject('voyent.auth.refreshAccessToken() no connect settings, cant refresh token');
                    }
                    else {
                        loginParams.account = atob(utils.getSessionStorageItem(btoa(keys.ACCOUNT_KEY)));
                        loginParams.realm = atob(utils.getSessionStorageItem(btoa(keys.REALM_KEY)));
                        loginParams.host = atob(utils.getSessionStorageItem(btoa(keys.HOST_KEY)));
                        loginParams.username = atob(utils.getSessionStorageItem(btoa(keys.USERNAME_KEY)));
                        loginParams.password = atob(utils.getSessionStorageItem(btoa(authKeys.PASSWORD_KEY)));
                        loginParams.suppressUpdateTimestamp = true;
                        loginParams.admin = atob(utils.getSessionStorageItem(btoa(keys.ADMIN_KEY)));
                        console.log('voyent.auth.refreshAccessToken()');
                        v.auth.login(loginParams).then(function (authResponse) {
                            fireEvent(window, 'voyent-access-token-refreshed', v.auth.getLastAccessToken());
                            if (loginParams.usePushService) {
                                // v.push.startPushService(loginParams);
                            }
                            resolve(authResponse);
                        }).catch(function (errorResponse) {
                            // Try and refresh the token once more after a small timeout
                            if (!isRetryAttempt) {
                                console.log('Failed to refresh token, trying again');
                                setTimeout(function() {
                                    v.auth.refreshAccessToken(true).then(function (response) {
                                        resolve(response);
                                    }).catch(function(e) {});
                                },2000);
                            }
                            else {
                                console.log('Failed to refresh token on retry:',errorResponse);
                                fireEvent(window, 'voyent-access-token-refresh-failed', {});
                                reject(errorResponse);
                            }
                        });
                    }
                }

            });
        },

        /**
         * Disconnect from Voyent Services.
         *
         * This function will logout from Voyent Services and remove all session information from the client.
         *
         * TODO
         *
         * @memberOf voyent.auth
         * @alias disconnect
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.username User name (required)
         * @param {String} params.password User password (required)
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {Promise} with the following argument:
         *      {
		 *          access_token: 'xxx',
		 *          expires_in: 99999
		 *      }
         *
         */
        disconnect: function () {
            utils.removeSessionStorageItem(btoa(keys.TOKEN_KEY));
            utils.removeSessionStorageItem(btoa(keys.TOKEN_EXPIRES_KEY));
            utils.removeSessionStorageItem(btoa(authKeys.CONNECT_SETTINGS_KEY));
            utils.removeSessionStorageItem(btoa(keys.TOKEN_SET_KEY));
            utils.removeSessionStorageItem(btoa(keys.ACCOUNT_KEY));
            utils.removeSessionStorageItem(btoa(keys.REALM_KEY));
            utils.removeSessionStorageItem(btoa(keys.USERNAME_KEY));
            utils.removeSessionStorageItem(btoa(keys.HOST_KEY));
            utils.removeSessionStorageItem(btoa(authKeys.PASSWORD_KEY));
            utils.removeSessionStorageItem(btoa(authKeys.LAST_ACTIVE_TS_KEY));
            var connectTimeoutCb = utils.getSessionStorageItem(btoa(authKeys.RELOGIN_CB_KEY));
            if (connectTimeoutCb) {
                clearTimeout(connectTimeoutCb);
            }
            utils.removeSessionStorageItem(btoa(authKeys.RELOGIN_CB_KEY));
            var compSleepIntervalCb = utils.getSessionStorageItem(btoa(authKeys.COMPUTER_SLEEP_CB_KEY));
            if (compSleepIntervalCb) {
                clearInterval(compSleepIntervalCb);
            }
            utils.removeSessionStorageItem(btoa(authKeys.COMPUTER_SLEEP_CB_KEY));
            console.log(new Date().toISOString() + ' voyent has disconnected');
            v.auth.connected = false;
        },

        getLastAccessToken: function () {
            return utils.getSessionStorageItem(btoa(keys.TOKEN_KEY));
        },

        getExpiresIn: function () {
            var expiresInStr = utils.getSessionStorageItem(btoa(keys.TOKEN_EXPIRES_KEY));
            if (expiresInStr) {
                return parseInt(expiresInStr, 10);
            }
        },

        getTokenSetAtTime: function () {
            var tokenSetAtStr = utils.getSessionStorageItem(btoa(keys.TOKEN_SET_KEY));
            if (tokenSetAtStr) {
                return parseInt(tokenSetAtStr, 10);
            }
        },

        getTimeRemainingBeforeExpiry: function () {
            var expiresIn = v.auth.getExpiresIn();
            var token = v.auth.getLastAccessToken();
            if (expiresIn && token) {
                var now = new Date().getTime();
                return (v.auth.getTokenSetAtTime() + expiresIn) - now;
            }
        },

        getConnectSettings: function () {
            var settingsStr = utils.getSessionStorageItem(btoa(authKeys.CONNECT_SETTINGS_KEY));
            if (settingsStr) {
                return JSON.parse(atob(settingsStr));
            }
        },

        isLoggedIn: function () {
            var token = utils.getSessionStorageItem(btoa(keys.TOKEN_KEY)),
                tokenExpiresInStr = utils.getSessionStorageItem(btoa(keys.TOKEN_EXPIRES_KEY)),
                tokenExpiresIn = tokenExpiresInStr ? parseInt(tokenExpiresInStr, 10) : null,
                tokenSetAtStr = utils.getSessionStorageItem(btoa(keys.TOKEN_SET_KEY)),
                tokenSetAt = tokenSetAtStr ? parseInt(tokenSetAtStr, 10) : null,
                scopeToPathCipher = utils.getSessionStorageItem(btoa(authKeys.SCOPE_TO_PATH_KEY)),
                scopeToPath = scopeToPathCipher ? atob(scopeToPathCipher) : '/',
                isDev, currentPath;
            if (!utils.isNode) {
                isDev = window.location.port !== '';
                currentPath = window.location.pathname;
            }
            //console.log('v.auth.isLoggedIn: token=' + token + ' tokenExpiresIn=' + tokenExpiresIn + 'tokenSetAt=' + tokenSetAt + ' (new Date().getTime() < (tokenExpiresIn + tokenSetAt))=' + (new Date().getTime() < (tokenExpiresIn + tokenSetAt)) + ' (currentPath.indexOf(scopeToPath) === 0)=' + (currentPath.indexOf(scopeToPath) === 0));
            var result = token && tokenExpiresIn && tokenSetAt && (new Date().getTime() < (tokenExpiresIn + tokenSetAt) ) && (utils.isNode || (!utils.isNode && (isDev || currentPath.indexOf(scopeToPath) === 0)));
            return !!result;
        },

        getLastKnownAccount: function () {
            var accountCipher = utils.getSessionStorageItem(btoa(keys.ACCOUNT_KEY));
            if (accountCipher) {
                return atob(accountCipher);
            }
        },

        getLastKnownRealm: function () {
            var realmCipher = utils.getSessionStorageItem(btoa(keys.REALM_KEY));
            if (realmCipher) {
                return atob(realmCipher);
            }
        },

        getLastKnownUsername: function () {
            var usernameCipher = utils.getSessionStorageItem(btoa(keys.USERNAME_KEY));
            if (usernameCipher) {
                return atob(usernameCipher);
            }
        },

        getLastKnownHost: function () {
            var hostCipher = utils.getSessionStorageItem(btoa(keys.HOST_KEY));
            if (hostCipher) {
                return atob(hostCipher);
            }
        },

        /**
         * Register a new user for a realm that supports open user registrations.
         *
         * @memberOf voyent.auth
         * @alias registerAsNewUser
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.username User name (required)
         * @param {String} params.password User password (required)
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {String} params.firstname The user's first name (optional)
         * @param {String} params.lastname The user's last name (optional)
         * @param {String} params.email The user's email (optional)
         * @param {Object} params.custom Custom user information
         * @returns Promise
         */
        registerAsNewUser: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    utils.validateRequiredUsername(params, reject);
                    utils.validateRequiredPassword(params, reject);

                    var user = {
                        username: params.username,
                        password: params.password
                    };

                    if ('firstname' in params) {
                        user.firstname = params.firstname;
                    }
                    if ('lastname' in params) {
                        user.lastname = params.lastname;
                    }
                    if ('email' in params) {
                        user.email = params.email;
                    }
                    if ('custom' in params) {
                        user.custom = params.custom;
                    }

                    var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                        'quickuser', token);

                    v.$.post(url, {user: user}).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Check if the current user has a single role.
         *
         * @memberOf voyent.auth
         * @alias checkUserRole
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {String} params.role The single role to check for
         * @returns Promise
         */
        checkUserRole: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var role = validateAndReturnRequiredRole(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'rolecheck/', token, {roleName: role});

                v.$.getJSON(url).then(function (response) {
                    if (response.results) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(true);
                    }
                    else {
                        reject(response);
                    }
                })['catch'](function (response) {
                    if (response.status == 403) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(false);
                    }
                    else {
                        reject(response);
                    }
                });
            });
        },

        /**
         * Check if the current user has a set of roles. The 'op' params can be added to check for 'or' or 'and'.
         *
         * @memberOf voyent.auth
         * @alias checkUserRole
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Array} params.roles The array of roles to check for
         * @param {Array} params.roles The array of roles to check for
         * @param {String} params.op The operator 'and' or 'or' ??? TODO
         * @param {String} params.username The username parameter TODO may be later removed
         *     http://jira.icesoft.org/browse/NTFY-216
         * @returns Promise
         */
        checkUserRoles: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var roles = validateAndReturnRequiredRoles(params, reject);
                var username = utils.validateAndReturnRequiredUsername(params, reject);

                var payload = {
                    roleBlock: [{
                        name: 'first',
                        roles: roles,
                        op: params.op
                    }]
                };

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'users/' + username + '/rolecheck', token);

                v.$.post(url, payload).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(true);
                })['catch'](function (response) {
                    if (response.status == 403) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(false);
                    }
                    else {
                        reject(response);
                    }
                });
            });
        },


        /**
         * Update the last active timestamp for Voyent auth. This value is used
         * when checking for clients-side session timeouts.
         * @memberOf voyent.auth
         * @alias updateLastActiveTimestamp
         */
        updateLastActiveTimestamp: function () {
            utils.setSessionStorageItem(btoa(authKeys.LAST_ACTIVE_TS_KEY), new Date().getTime());
        },

        /**
         * Return the timestamp of the last voyent op or when voyent.auth.updateLastActiveTimestamp()
         * was called.
         * @memberOf voyent.auth
         * @alias getLastActiveTimestamp
         */
        getLastActiveTimestamp: function () {
            return utils.getSessionStorageItem(btoa(authKeys.LAST_ACTIVE_TS_KEY));
        },

        forgotPassword: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var username = utils.validateAndReturnRequiredUsername(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/' + account + '/';

                if (params.realm) {
                    url += 'realms/' + params.realm + '/users/' + username + '/emailpassword';
                }
                else { //admin
                    url += 'admins/' + username + '/emailpassword';
                }
                url += (txParam ? '?' + txParam : '');

                v.$.post(url).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(true);
                })['catch'](function (response) {
                    reject(response);
                });
            });
        },

        /**
         * Return a generated password that matches the requirements of our service
         * Specifically: /^[A-Za-z0-9!@#%^&*_\s]*$/
         * This can be leveraged as part of anonymous user creation
         *
         * Credit goes to http://stackoverflow.com/a/12635919
         *
         * @returns String password
         */
        generatePassword: function () {
            var specials = '!@#%^&*_';
            var lowercase = 'abcdefghijklmnopqrstuvwxyz';
            var uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            var numbers = '0123456789';
            var all = specials + lowercase + uppercase + numbers;

            String.prototype.pick = function (min, max) {
                var n, chars = '';

                if (typeof max === 'undefined') {
                    n = min;
                } else {
                    n = min + Math.floor(Math.random() * (max - min));
                }

                for (var i = 0; i < n; i++) {
                    chars += this.charAt(Math.floor(Math.random() * this.length));
                }

                return chars;
            };

            String.prototype.shuffle = function () {
                var array = this.split('');
                var tmp, current, top = array.length;

                if (top) while (--top) {
                    current = Math.floor(Math.random() * (top + 1));
                    tmp = array[current];
                    array[current] = array[top];
                    array[top] = tmp;
                }

                return array.join('');
            };

            return (specials.pick(1) + lowercase.pick(1) + uppercase.pick(1) + all.pick(5, 10)).shuffle();
        }
    };
}
function AdminService(v, keys, utils) {
    function validateRequiredUser(params, reject) {
        utils.validateParameter('user', 'The user parameter is required', params, reject);
    }

    function validateRequiredRole(params, reject) {
        utils.validateParameter('role', 'The role parameter is required', params, reject);
    }
    
    function validateRequiredGroup(params, reject) {
        utils.validateParameter('group', 'The group parameter is required', params, reject);
    }

    function validateAndReturnRequiredEmail(params, reject) {
        var email = params.email;
        if (email) {
            return email;
        }
        else {
            return reject(Error('The Voyent email parameter is required'));
        }
    }

    function validateAndReturnRequiredFirstname(params, reject) {
        var firstname = params.firstname;
        if (firstname) {
            return firstname;
        }
        else {
            return reject(Error('The Voyent firstname parameter is required'));
        }
    }

    function validateAndReturnRequiredLastname(params, reject) {
        var lastname = params.lastname;
        if (lastname) {
            return lastname;
        }
        else {
            return reject(Error('The Voyent lastname parameter is required'));
        }
    }

    function validateRequiredConfirmationId(params, reject) {
        utils.validateParameter('confirmationId', 'The confirmationId parameter is required', params, reject);
    }

    function validateRequiredAccount(params, reject) {
        utils.validateParameter('account', 'The account parameter is required', params, reject);
    }

    function validateRequiredMetadata(params, reject) {
        utils.validateParameter('metadata', 'The metadata parameter is required', params, reject);
    }

    function validateAndReturnRequiredAdmin(params, reject) {
        var admin = params.admin;
        if (admin) {
            return admin;
        }
        else {
            return reject(Error('The admin parameter is required'));
        }
    }

    function validateAndReturnRequiredOriginRealmName(params, reject) {
        var realm = params.originRealmName;
        if (realm) {
            realm = encodeURI(realm);
        }
        else {
            realm = v.auth.getLastKnownRealm();
        }
        if (realm) {
            return realm;
        }
        else {
            return reject(Error('The Voyent originRealmName is required'));
        }
    }

    function validateAndReturnRequiredDestRealmName(params, reject) {
        var realm = params.destRealmName;
        if (realm) {
            realm = encodeURI(realm);
            return realm;
        }
        else {
            return reject(Error('The Voyent destRealmName is required'));
        }
    }

    return {

        /**
         * Get the Voyent Service definitions.
         *
         * @memberOf voyent.admin
         * @alias getServiceDefinitions
         * @param {Object} params params
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns Promise with a json object of the service definitions
         *
         */
        getServiceDefinitions: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var txParam = utils.getTransactionURLParam();
                    var url = v.authAdminURL + '/system/services/?access_token=' + token +
                        (txParam ? '&' + txParam : '');

                    v.$.getJSON(url).then(function (json) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(json);
                    })['catch'](function (error) {
                        reject(error);
                    });

                }
            );
        },

        getAccount: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/' + account + '?access_token=' + token +
                    (txParam ? '&' + txParam : '');

                v.$.getJSON(url).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.account);
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        /**
         * Create a new Voyent Account. After successfully creating the account, the new administrator will
         * be automatically logged in.
         *
         * @memberOf voyent.admin
         * @alias createAccount
         * @param {Object} params params
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {String} params.account The name of the new account (required)
         * @param {String} params.username The username for the new administrator (required)
         * @param {String} params.email The email of the new administrator (required)
         * @param {String} params.firstname The first name of the new administrator (required)
         * @param {String} params.lastname The last name of the new administrator (required)
         * @param {String} params.password The password of the new administrator (required)
         * @returns Promise with an access token for the new administrator
         *
         */
        createAccount: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                var account = {admins: []};
                var accountname = utils.validateAndReturnRequiredAccount(params, reject);
                account.accountname = accountname;

                if (params.description) {
                    account.description = params.description;
                }

                var admin = {};
                var username = utils.validateAndReturnRequiredUsername(params, reject);
                admin.username = username;
                utils.validateRequiredPassword(params, reject);
                admin.password = params.password;
                admin.email = validateAndReturnRequiredEmail(params, reject);
                admin.firstname = validateAndReturnRequiredFirstname(params, reject);
                admin.lastname = validateAndReturnRequiredLastname(params, reject);

                // Check for email metadata
                // If present we need to mark the admin unconfirmed, and pass the metadata
                if (params.metadata) {
                    admin.unconfirmed = "true";
                    account.metadata = params.metadata;
                }

                // Add our admin user to the list
                account.admins.push(admin);

                // Add custom field(s) if present
                if (params.custom) {
                    account.custom = params.custom;
                }

                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/' + (txParam ? '&' + txParam : '');
                var loggedInAt = new Date().getTime();
                v.$.post(url, {account: account}).then(function (json) {
                    v.auth.updateLastActiveTimestamp();

                    utils.setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(accountname));
                    utils.setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(username));
                    utils.setSessionStorageItem(btoa(keys.ADMIN_KEY), btoa('true'));
                    if (params.host) {
                        utils.setSessionStorageItem(btoa(keys.HOST_KEY), btoa(params.host));
                    }

                    // May not have a token if the account required email confirmation validation first
                    if (json.token) {
                        utils.setSessionStorageItem(btoa(keys.TOKEN_KEY), json.token.access_token);
                        utils.setSessionStorageItem(btoa(keys.TOKEN_EXPIRES_KEY), json.token.expires_in);
                        utils.setSessionStorageItem(btoa(keys.TOKEN_SET_KEY), loggedInAt);

                        resolve(json.token.access_token);
                    }
                    else {
                        resolve(json);
                    }
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },
        
        /**
         * Update an entire account
         *
         * @memberOf voyent.admin
         * @alias editAccount
         * @param {Object} params params
         * @param {String} params.accountname The account name to update
         * @returns Promise
         */
        updateTopLevelAccount: function(params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                
                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/'
                           + account + '?access_token=' + token + (txParam ? '&' + txParam : '');
                
                v.$.put(url, {'account': params}).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
        
        /**
         * Update an account admin
         *
         * @memberOf voyent.admin
         * @alias updateAccount
         * @param {Object} params params
         * @param {String} params.username The admin username to update (required)
         * @param {String} params.email Updated email
         * @param {String} params.firstname Updated first name
         * @param {String} params.lastname Updated last name
         * @param {String} params.custom Any custom data (optional)
         * @param {String} params.password Password to update, if not present will remain unchanged
         * @returns Promise
         */
        updateAccount: function(params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                // Ensure we have an admin username
                if (!params.username || typeof params.username === 'undefined') {
                    reject(Error('Admin username to update is required'));
                }
                
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                
                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/'
                           + account + '/admins/' + params.username + '?access_token=' + token + (txParam ? '&' + txParam : '');
                
                v.$.put(url, {'admin': params}).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        /**
         * Attempt to confirm an account
         * This would happen when a new account (from createAccount) had an email confirmation sent to them
         *
         * @param {Object} params
         * @param {String} params.confirmationId from the email and returned url, used to check
         * @param {String} params.account to validate with
         * @returns Promise containing the response, which if successful will have username available
         */
        confirmAccount: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                // Check confirmationId and account
                validateRequiredConfirmationId(params, reject);
                validateRequiredAccount(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/' + params.account + '/confirm' + (txParam ? '&' + txParam : '');
                v.$.post(url, {confirmationId: params.confirmationId}).then(function (json) {
                    // Store the returned username, and also the param account and realm if available
                    if (json.username) {
                        utils.setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(json.username));
                    }
                    if (params.account) {
                        utils.setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(params.account));
                    }
                    if (params.realm) {
                        utils.setSessionStorageItem(btoa(keys.REALM_KEY), btoa(params.realm));
                    }

                    resolve(json);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        /**
         * Resend the confirmation email for an account registration
         * This will mark the account unconfirmed/invalid as part of the process
         *
         * @param {Object} params
         * @param {String} params.metadata containing the email template
         * @param {String} params.account to send the email to
         * @param {String} params.username to send the email to
         * @returns Promise containing the response
         */
        resendConfirmAccountEmail: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                // Check metadata, account, and username
                validateRequiredMetadata(params, reject);
                validateRequiredAccount(params, reject);
                utils.validateRequiredUsername(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/'
                    + params.account + '/admins/'
                    + params.username + '/resendLink'
                    + (txParam ? '&' + txParam : '');
                v.$.post(url, {metadata: params.metadata}).then(function (json) {
                    resolve(json);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        /* Realm admin */

        getRealms: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var url = v.authAdminURL + '/' + account + '/realms/'
                    + '?access_token=' + token + '&' + utils.getTransactionURLParam();

                v.$.getJSON(url).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.realms);
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        getRealm: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                // Set 'nostore' to ensure the following checks don't update our lastKnown calls
                params.nostore = true;

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    '', token);

                v.$.getJSON(url).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.realm);
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        updateRealm: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateRequiredRealm(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, params.realm.name,
                    '', token);

                v.$.put(url, {realm: params.realm}).then(function () {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        createRealm: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateAndReturnRequiredRealmName(params, reject);
                utils.validateRequiredRealm(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/' + account + '/realms?access_token=' + token +
                    (txParam ? '&' + txParam : '');

                v.$.post(url, {realm: params.realm}).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.resourceLocation);
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        cloneRealm: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var originRealmName = validateAndReturnRequiredOriginRealmName(params, reject);
                var destRealmName = validateAndReturnRequiredDestRealmName(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/' + account + '/realms/' + originRealmName + '/clone/' +
                    destRealmName + '?access_token=' + token + (txParam ? '&' + txParam : '');

                v.$.post(url, {realm: params.realm}).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.resourceLocation);
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        deleteRealm: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                // Set 'nostore' to ensure the following checks don't update our lastKnown calls
                params.nostore = true;

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var realmName = utils.validateAndReturnRequiredRealmName(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realmName,
                    '', token);

                console.log('voyent.admin.deleteRealm() ' + url);

                v.$.doDelete(url).then(function () {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        /* Realm Users */

        getRealmUsers: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                // Set 'nostore' to ensure the following checks don't update our lastKnown calls
                params.nostore = true;

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'users/', token, {
                        'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                        'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                        'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                    }
                );

                v.$.getJSON(url).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.users);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        createRealmUser: function (params, fromUser) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                // Set 'nostore' to ensure the following checks don't update our lastKnown calls
                params.nostore = true;
                
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                
                validateRequiredUser(params, reject);
                
                // By default hit the "users" endpoint, which is used for admins
                // However if the call is from a user trying to create another user, then use the "realmUser" endpoint
                var endpoint = 'users';
                if (fromUser) {
                    endpoint = 'realmUser';
                }
                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    endpoint, token);

                var toPost = {user: params.user};

                if (params.metadata) {
                    toPost.metadata = params.metadata;
                }

                v.$.post(url, toPost).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(response.resourceLocation);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        /**
         * Attempt to create an anonymous realm user
         *
         * @param {Object} params
         * @param {String} params.account to validate with
         * @param {String} params.realmName to validate with
         * @returns Object with the username and password
         */
        createAnonUser: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'register', false);

                var password = v.auth.generatePassword();
                var toPost = {user: {password: password}};

                if (params.metadata) {
                    toPost.metadata = params.metadata;
                }
                if (params.custom) {
                    toPost.user.custom = params.custom;
                }

                v.$.post(url, toPost).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    var anonUser = {
                        password: password,
                        username: response.resourceLocation.substring(response.resourceLocation.lastIndexOf('/') + 1)
                    };
                    resolve(anonUser);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
        
        /**
         * Attempt to create/register a new realm user
         * If no password is provided (under params.users.password) one will be generated
         *
         * @param {Object} params
         * @param {String} params.account to validate with
         * @param {String} params.realm to validate with
         * @param {Object} params.user containing details to create
         */
        createUser: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                
                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm, 'register');
                
                // Check for user data
                if (!params.user) {
                    reject(Error('No user data to submit was found'));
                    return;
                }
                
                // If no password is found, generate one
                if (!params.user.password) {
                    params.user.password = v.auth.generatePassword();
                }
                
                v.$.post(url, params).then(function (response) {
                    resolve(response);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        /**
         * Attempt to confirm a realm user account
         * This would happen when a new realm user (from createRealmUser) had an email confirmation sent to them
         *
         * @param {Object} params
         * @param {String} params.confirmationId from the email and returned url, used to check
         * @param {String} params.account to validate with
         * @param {String} params.realm to validate with
         * @returns Promise containing the response, which if successful will have username available
         */
        confirmRealmUser: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                // Check confirmationId, account, and realm
                validateRequiredConfirmationId(params, reject);
                validateRequiredAccount(params, reject);
                utils.validateRequiredRealm(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL
                    + '/' + params.account
                    + '/realms/' + params.realm
                    + '/confirm' + (txParam ? '&' + txParam : '');
                v.$.post(url, {confirmationId: params.confirmationId}).then(function (json) {
                    // Store the returned username, and also the param account and realm if available
                    if (json.username) {
                        utils.setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(json.username));
                    }
                    if (params.account) {
                        utils.setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(params.account));
                    }
                    if (params.realm) {
                        utils.setSessionStorageItem(btoa(keys.REALM_KEY), btoa(params.realm));
                    }

                    resolve(json);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        /**
         * Resend the confirmation email for a realm user account registration
         * This will mark the realm user unconfirmed/invalid as part of the process
         *
         * @param {Object} params
         * @param {String} params.metadata containing the email template
         * @param {String} params.account to send the email to
         * @param {String} params.username to send the email to
         * @returns Promise containing the response
         */
        resendConfirmRealmUserEmail: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                // Check metadata, account, and username
                validateRequiredMetadata(params, reject);
                validateRequiredAccount(params, reject);
                utils.validateRequiredRealm(params, reject);
                utils.validateRequiredUsername(params, reject);

                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/' + params.account
                    + '/realms/' + params.realm
                    + '/users/' + params.username + '/invalidate?access_token=' + token
                    + (txParam ? '&' + txParam : '');
                v.$.post(url, {metadata: params.metadata}).then(function (json) {
                    resolve(json);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        getRealmUser: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                // Set 'nostore' to ensure the following checks don't update our lastKnown calls
                params.nostore = true;

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var username = utils.validateAndReturnRequiredUsername(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'users/' + username, token);

                v.$.getJSON(url).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.user);
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        updateRealmUser: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                validateRequiredUser(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'users/' + params.user.username, token);

                v.$.put(url, {user: params.user}).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        deleteRealmUser: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                // Set 'nostore' to ensure the following checks don't update our lastKnown calls
                params.nostore = true;

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateAndReturnRequiredUsername(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'users/' + params.username, token);

                v.$.doDelete(url).then(function () {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        /* Realm Roles */

        getRealmRoles: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'roles', token);

                v.$.getJSON(url).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.roles);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        createRealmRole: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                validateRequiredRole(params, reject);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'roles', token);

                v.$.post(url, {role: params.role}).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(response.resourceLocation);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        updateRealmRole: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                validateRequiredRole(params, reject);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'roles/' + params.role.name, token);

                v.$.put(url, {role: params.role}).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        deleteRealmRole: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                validateRequiredId(params, reject);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'roles/' + params.id, token);

                v.$.doDelete(url).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        /* Realm Contexts */

        getAllRealmContexts: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'contexts', token);

                v.$.getJSON(url).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.contexts);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        getRealmContext: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'contexts/' + params.username, token);

                v.$.getJSON(url).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.context);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        updateRealmContext: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                validateRequiredRole(params, reject);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'contexts/' + params.context.username, token);

                v.$.put(url, {context: params.context}).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        getLogs: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var query = params.query ? encodeURIComponent(JSON.stringify(params.query)) : '{}';
                var fields = params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : '{}';
                var options = params.options ? encodeURIComponent(JSON.stringify(params.options)) : '{}';

                var url = v.authAdminURL + '/' + account + '/logging/?access_token=' +
                    token + '&query=' + query + '&fields=' + fields + '&options=' + options;

                v.$.getJSON(url).then(function (logs) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(logs);
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        getDebugLogs: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var query = params.query ? encodeURIComponent(JSON.stringify(params.query)) : '{}';
                var fields = params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : '{}';
                var options = params.options ? encodeURIComponent(JSON.stringify(params.options)) : '{}';

                var url = v.authAdminURL + '/' + account + '/realms/' + realm +
                    '/debugLogging/?access_token=' + token + '&query=' + query + '&fields=' + fields + '&options=' + options;

                v.$.getJSON(url).then(function (logs) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(logs);
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        createAdministrator: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var admin = utils.validateAndReturnRequiredAdmin(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/' + account + '/admins/?access_token=' + token +
                    (txParam ? '&' + txParam : '');

                v.$.post(url, {admin: admin}).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        updateAdministrator: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var admin = utils.validateAndReturnRequiredAdmin(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/' + account + '/admins/' + admin.username +
                    '/?access_token=' + token + (txParam ? '&' + txParam : '');

                v.$.put(url, {admin: admin}).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        deleteAdministrator: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                utils.validateRequiredUsername(params, reject);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var username = utils.validateAndReturnRequiredUsername(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/' + account + '/admins/' + username + '/?access_token=' + token +
                    (txParam ? '&' + txParam : '');

                v.$.doDelete(url).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
        
        getAllUserGroups: function(params) {
            return new Promise(function(resolve, reject) {
                params = params ? params : {};

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'groups/', token);
                    
                v.$.get(url).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(response);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
        
        getUserGroupDetails: function(params) {
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                
                validateRequiredGroup(params, reject);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'groups/' + params.group + '/details', token);
                    
                v.$.get(url).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(response);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
        
        createUserGroup: function(params) {
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                
                validateRequiredGroup(params, reject);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'groups/', token);
                    
                v.$.post(url, { group: params.group }).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(response);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
        
        updateUserGroup: function(params) {
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                
                validateRequiredGroup(params, reject);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'groups/' + params.group.name, token);
                    
                v.$.put(url, { group: params.group }).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(response);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
        
        deleteUserGroup: function(params) {
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                
                validateRequiredGroup(params, reject);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'groups/' + params.group, token);
                    
                v.$.doDelete(url).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(response);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
    };
}
function ActionService(v, utils) {
    function validateRequiredAction(params, reject) {
        utils.validateParameter('action', 'The action parameter is required', params, reject);
    }

    return {
        /**
         * Execute an action
         *
         * @memberOf voyent.action
         * @alias executeAction
         * @param {Object} params params
         * @param {String} params.id The action id, the action to be executed
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.io.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {String} The resource URI
         */
        executeAction: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.actionURL, account, realm,
                        'actions/' + params.id, token, {'op': 'exec'});

                    v.$.post(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        reject(error);
                    });

                }
            );
        },

        /**
         * Create a new action
         *
         * @memberOf voyent.action
         * @alias createAction
         * @param {Object} params params
         * @param {String} params.id The action id
         * @param {Object} params.action The action to be created
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.io.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {String} The resource URI
         */
        createAction: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredAction(params, reject);

                    var url = utils.getRealmResourceURL(v.actionURL, account, realm,
                        'actions/' + params.id, token);

                    v.$.post(url, params.action).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function (error) {
                        reject(error);
                    });

                }
            );
        },

        /**
         * Update an action
         *
         * @memberOf voyent.action
         * @alias updateAction
         * @param {Object} params params
         * @param {String} params.id The action id, the action to be updated
         * @param {Object} params.action The new action
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.io.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        updateAction: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredAction(params, reject);

                    var url = utils.getRealmResourceURL(v.actionURL, account, realm,
                        'actions/' + params.id, token);

                    v.$.put(url, params.action).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetch an action
         *
         * @memberOf voyent.action
         * @alias getAction
         * @param {Object} params params
         * @param {String} params.id The action id, the action to fetch
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.io.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {Object} The action
         */
        getAction: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.actionURL, account, realm,
                        'actions/' + params.id, token);

                    v.$.getJSON(url).then(function (action) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(action);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Searches for actions in a realm based on a query
         *
         * @memberOf voyent.action
         * @alias findActions
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.io.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.query A mongo query for the actions
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findActions: function (params) {
            return new Promise(
                function (resolve, reject) {

                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.actionURL, account, realm,
                        'actions/', token, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function (actions) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(actions);
                    })['catch'](function (response) {
                        reject(response);
                    });

                }
            );
        },

        /**
         * Delete an action
         *
         * @memberOf voyent.action
         * @alias deleteAction
         * @param {Object} params params
         * @param {String} params.id The action id, the action to be deleted
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.io.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        deleteAction: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.actionURL, account, realm,
                        'actions/' + params.id, token);

                    v.$.doDelete(url).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetch available task groups
         *
         * @memberOf voyent.action
         * @alias getTaskGroups
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.io.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {Object} The task group schemas
         */
        getTaskGroups: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.actionURL, account, realm,
                        'taskGroups/', token);

                    v.$.getJSON(url).then(function (tasksGroups) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(tasksGroups);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetch available tasks
         *
         * @memberOf voyent.action
         * @alias getTasks
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.io.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {Object} The task schemas
         */
        getTasks: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.actionURL, account, realm,
                        'tasks/', token);

                    v.$.getJSON(url).then(function (tasks) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(tasks);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Execute a module.
         *
         * @memberOf voyent.action
         * @alias executeModule
         * @param {Object} params params
         * @param {String} params.id The module id, the module to be executed
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.io.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {String} The resource URI
         */
        executeModule: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.actionURL, account, realm,
                        'modules/' + params.id, token);

                    v.$.post(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        reject(error);
                    });

                }
            );
        },

        getResourcePermissions: function (params) {
            params.service = 'action';
            params.path = 'actions';
            return v.getResourcePermissions(params);
        },

        updateResourcePermissions: function (params) {
            params.service = 'action';
            params.path = 'actions';
            return v.updateResourcePermissions(params);
        }
    };
}
function DeviceService(v, utils) {
    return {
        /**
         * Start live reporting of a device
         *
         * @memberOf voyent.device
         * @alias startDevice
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.macAddress The address of the device to start.
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         */
        startDevice: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.deviceURL, account, realm,
                    params.macAddress + '/start', token);

                v.$.put(url, {}).then(function () {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        /**
         * Stop live reporting of a device
         *
         * @memberOf voyent.device
         * @alias stopDevice
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.macAddress The address of the device to stop.
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         */
        stopDevice: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.deviceURL, account, realm,
                    params.macAddress + '/stop', token);

                v.$.put(url, {}).then(function () {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        /**
         * Stop all device reporting
         *
         * @memberOf voyent.device
         * @alias stopDevices
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         */
        stopDevices: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateRequiredId(params, reject);

                var url = utils.getRealmResourceURL(v.deviceURL, account, realm, '/stop', token);

                v.$.put(url, {}).then(function () {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        /**
         * Get all devices reporting on realm/account
         *
         * @memberOf voyent.device
         * @alias getRunningDevices
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         */
        getRunningDevices: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.deviceURL, account, realm, '/running', token);

                v.$.getJSON(url).then(function (devices) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(devices);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        }
    };
}function DocService(v, utils) {
    function validateCollection(params, reject) {
        return params.collection ? params.collection : 'documents';
    }

    return {

        /**
         * Create a new document
         *
         * @memberOf voyent.docs
         * @alias createDocument
         * @param {Object} params params
         * @param {String} params.collection The name of the document collection.  Defaults to 'documents'.
         * @param {String} params.id The document id. If not provided, the service will return a new id
         * @param {Object} params.document The document to be created
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {String} The resource URI
         */
        createDocument: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var collection = validateCollection(params);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.docsURL, account, realm,
                        collection + '/' + (params.id ? params.id : ''), token);

                    v.$.post(url, params.document).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function (error) {
                        reject(error);
                    });

                }
            );
        },

        /**
         * Update a document
         *
         * @memberOf voyent.docs
         * @alias updateDocument
         * @param {Object} params params
         * @param {String} params.collection The name of the document collection.  Defaults to 'documents'.
         * @param {String} params.id The document id.
         * @param {Object} params.document The document to be created
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {String} The resource URI
         */
        updateDocument: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var collection = validateCollection(params);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.docsURL, account, realm,
                        collection + '/' + params.id, token);

                    v.$.put(url, params.document).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetch a document
         *
         * @memberOf voyent.docs
         * @alias getDocument
         * @param {Object} params params
         * @param {String} params.collection The name of the document collection.  Defaults to 'documents'.
         * @param {String} params.id The document id. If not provided, the service will return a new id
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {Object} The document
         */
        getDocument: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var collection = validateCollection(params);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.docsURL, account, realm,
                        collection + '/' + params.id, token);

                    v.$.getJSON(url).then(function (doc) {
                        v.auth.updateLastActiveTimestamp();
                        //the document service always returns a list, so
                        //check if we have a list of one, and if so, return the single item
                        if (doc.length && doc.length === 1) {
                            resolve(doc[0]);
                        }
                        else {
                            resolve(doc);
                        }
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Searches for documents in a realm based on a query
         *
         * @memberOf voyent.docs
         * @alias findDocuments
         * @param {Object} params params
         * @param {String} params.collection The name of the document collection.  Defaults to 'documents'.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.query A mongo query for the documents
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findDocuments: function (params) {
            return new Promise(
                function (resolve, reject) {

                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var collection = validateCollection(params);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.docsURL, account, realm,
                        collection, token, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function (doc) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(doc);
                    })['catch'](function (response) {
                        //service currently returns a 404 when no documents are found
                        if (response.status == 404) {
                            resolve(null);
                        }
                        else {
                            reject(response);
                        }
                    });

                }
            );
        },

        /**
         * Get all document collections
         *
         * @memberOf voyent.docs
         * @alias deleteDocument
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account will
         *     be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name will
         *     be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */

        getCollections: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.docsURL, account, realm,
                        "collections", token, {});

                    v.$.getJSON(url).then(function (collections) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(collections);
                    })['catch'](function (response) {
                        //service currently returns a 404 when no collections are found
                        if (response.status == 404) {
                            resolve(null);
                        }
                        else {
                            reject(response);
                        }
                    });
                }
            );
        },

        /**
         * Delete a new document
         *
         * @memberOf voyent.docs
         * @alias deleteDocument
         * @param {Object} params params
         * @param {String} params.collection The name of the document collection.  Defaults to 'documents'.
         * @param {String} params.id The document id. If not provided, the service will return a new id
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        deleteDocument: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var collection = validateCollection(params);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.docsURL, account, realm,
                        collection + '/' + params.id, token);

                    v.$.doDelete(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        getResourcePermissions: function (params) {
            params.service = 'docs';
            params.path = 'documents';
            return v.getResourcePermissions(params);
        },

        updateResourcePermissions: function (params) {
            params.service = 'docs';
            params.path = 'documents';
            return v.updateResourcePermissions(params);
        }
    };
}function EventHubService(v, utils) {
    function validateRequiredHandler(params, reject) {
        utils.validateParameter('handler', 'The handler parameter is required', params, reject);
    }

    function validateRequiredRecognizer(params, reject) {
        utils.validateParameter('handler', 'The recognizer parameter is required', params, reject);
    }

    var eventhub = {
        /**
         * Create a new event handler
         *
         * @memberOf voyent.eventhub
         * @alias createHandler
         * @param {Object} params params
         * @param {String} params.id The handler id
         * @param {Object} params.handler The event handler to be created
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {String} The resource URI
         */
        createHandler: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredHandler(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'handlers/' + (params.id ? params.id : ''), token);

                    v.$.post(url, params.handler).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function (error) {
                        reject(error);
                    });

                }
            );
        },

        /**
         * Update an event handler
         *
         * @memberOf voyent.eventhub
         * @alias updateHandler
         * @param {Object} params params
         * @param {String} params.id The handler id, the event handler to be updated
         * @param {Object} params.handler The new event handler
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        updateHandler: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredHandler(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'handlers/' + params.id, token);

                    v.$.put(url, params.handler).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetch an event handler
         *
         * @memberOf voyent.eventhub
         * @alias getHandler
         * @param {Object} params params
         * @param {String} params.id The handler id, the event handler to fetch
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {Object} The event handler
         */
        getHandler: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'handlers/' + params.id, token);

                    v.$.getJSON(url).then(function (handler) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(handler);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Searches for event handlers in a realm based on a query
         *
         * @memberOf voyent.eventhub
         * @alias findHandlers
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.query A mongo query for the event handlers
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findHandlers: function (params) {
            return new Promise(
                function (resolve, reject) {

                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'handlers/', token, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function (handlers) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(handlers);
                    })['catch'](function (response) {
                        reject(response);
                    });

                }
            );
        },

        /**
         * Delete an event handler
         *
         * @memberOf voyent.eventhub
         * @alias deleteHandler
         * @param {Object} params params
         * @param {String} params.id The handler id, the event handler to be deleted
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        deleteHandler: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'handlers/' + params.id, token);

                    v.$.doDelete(url).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete event handlers in a realm based on a query
         *
         * @memberOf voyent.eventhub
         * @alias deleteHandlers
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.query A mongo query for the event handlers
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         */
        deleteHandlers: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'handlers/', token, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.doDelete(url).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Create a new event recognizer
         *
         * @memberOf voyent.eventhub
         * @alias createRecognizer
         * @param {Object} params params
         * @param {String} params.id The recognizer id
         * @param {Object} params.recognizer The event recognizer to be created
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {String} The resource URI
         */
        createRecognizer: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredRecognizer(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'recognizers/' + (params.id ? params.id : ''), token);

                    v.$.post(url, params.recognizer).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function (error) {
                        reject(error);
                    });

                }
            );
        },

        /**
         * Update an event recognizer
         *
         * @memberOf voyent.eventhub
         * @alias updateRecognizer
         * @param {Object} params params
         * @param {String} params.id The recognizer id, the event recognizer to be updated
         * @param {Object} params.recognizer The new event recognizer
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        updateRecognizer: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredRecognizer(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'recognizers/' + params.id, token);

                    v.$.put(url, params.recognizer).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetch an event recognizer
         *
         * @memberOf voyent.eventhub
         * @alias getRecognizer
         * @param {Object} params params
         * @param {String} params.id The recognizer id, the event recognizer to fetch
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {Object} The event recognizer
         */
        getRecognizer: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'recognizers/' + params.id, token);

                    v.$.getJSON(url).then(function (recognizer) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(recognizer);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Searches for event recognizers in a realm based on a query
         *
         * @memberOf voyent.eventhub
         * @alias findRecognizers
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.query A mongo query for the event recognizers
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findRecognizers: function (params) {
            return new Promise(
                function (resolve, reject) {

                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'recognizers/', token, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function (recognizers) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(recognizers);
                    })['catch'](function (response) {
                        reject(response);
                    });

                }
            );
        },

        /**
         * Delete an event recognizer
         *
         * @memberOf voyent.eventhub
         * @alias deleteRecognizer
         * @param {Object} params params
         * @param {String} params.id The recognizer id, the event recognizer to be deleted
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        deleteRecognizer: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'recognizers/' + params.id, token);

                    v.$.doDelete(url).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete event recognizers in a realm based on a query
         *
         * @memberOf voyent.eventhub
         * @alias deleteRecognizers
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.query A mongo query for the event recognizers
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         */
        deleteRecognizers: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'recognizers/', token, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.doDelete(url).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        getRecognizerResourcePermissions: function (params) {
            params.path = 'recognizers';
            return eventhub.getResourcePermissions(params);
        },

        updateRecognizerResourcePermissions: function (params) {
            params.path = 'recognizers';
            return eventhub.getResourcePermissions(params);
        },

        getHandlerResourcePermissions: function (params) {
            params.path = 'handlers';
            return eventhub.getResourcePermissions(params);
        },

        updateHandlerResourcePermissions: function (params) {
            params.path = 'handlers';
            return eventhub.updateResourcePermissions(params);
        },

        getResourcePermissions: function (params) {
            params.service = 'eventhub';
            return v.getResourcePermissions(params);
        },

        updateResourcePermissions: function (params) {
            params.service = 'eventhub';
            return v.updateResourcePermissions(params);
        }
    };

    return eventhub;
}function LocateService(v, utils) {
    function validateRequiredRegion(params, reject) {
        utils.validateParameter('region', 'The region parameter is required', params, reject);
    }

    function validateRequiredMonitor(params, reject) {
        utils.validateParameter('monitor', 'The monitor parameter is required', params, reject);
    }

    function validateRequiredPOI(params, reject) {
        utils.validateParameter('poi', 'The poi parameter is required', params, reject);
    }

    function validateRequiredLocation(params, reject) {
        utils.validateParameter('location', 'The location parameter is required', params, reject);
    }

    function validateRequiredLat(params, reject) {
        utils.validateParameter('lat', 'The lat parameter is required', params, reject);
    }

    function validateRequiredLon(params, reject) {
        utils.validateParameter('lon', 'The lon parameter is required', params, reject);
    }

    function validateRequiredAlert(params, reject) {
        utils.validateParameter('alert', 'The alert parameter is required', params, reject);
    }

    function validateRequiredCoordinates(params, reject) {
        utils.validateParameter('coordinates', 'The coordinates parameter is required', params, reject);
    }

    function validateRequiredAlertTemplate(params, reject) {
        utils.validateParameter('alertTemplate', 'The alertTemplate parameter is required', params, reject);
    }

    function validateRequiredAlertProperties(params, reject) {
        if (!params.location.location.properties || !params.location.location.properties.alertId) {
            reject(Error('The property alertId is required'));
        }
    }

    function validateRequiredState(params, reject) {
        utils.validateParameter('state', 'The state is required', params, reject);
    }


    var locate = {
        /**
         * Create a new region.
         *
         * @memberOf voyent.locate
         * @alias createRegion
         * @param {Object} params params
         * @param {String} params.id The region id. If not provided, the service will return a new id
         * @param {Object} params.region The region geoJSON document that describes the region to be created
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {String} The resource URI
         */
        createRegion: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredRegion(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'regions/' + (params.id ? params.id : ''), token);

                    v.$.post(url, params.region).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Update a region.
         *
         * @memberOf voyent.locate
         * @alias updateRegion
         * @param {Object} params params
         * @param {String} params.id The region id, the region to be updated
         * @param {Object} params.region The new region
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        updateRegion: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredRegion(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'regions/' + params.id, token);

                    v.$.put(url, params.region).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete a new region.
         *
         * @memberOf voyent.locate
         * @alias deleteRegion
         * @param {Object} params params
         * @param {String} params.id The region id.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        deleteRegion: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'regions/' + params.id, token);

                    v.$.doDelete(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetches all saved regions for the realm.
         *
         * @memberOf voyent.locate
         * @alias getAllRegions
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {Object} The results
         */
        getAllRegions: function (params) {
            return new Promise(
                function (resolve, reject) {

                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'regions', token);

                    v.$.getJSON(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Searches for regions in a realm based on a query.
         *
         * @memberOf voyent.locate
         * @alias findRegions
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.query A mongo query for the regions
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findRegions: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    // Set 'nostore' to ensure the following checks don't update our lastKnown calls
                    params.nostore = true;

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'regions', token, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        if (error.status === 404) {
                            resolve();
                        }
                        else {
                            reject(error);
                        }
                    });
                }
            );
        },

        /**
         * Create a new location point of interest.
         *
         * @memberOf voyent.locate
         * @alias createPOI
         * @param {Object} params params
         * @param {String} params.id The POI id. If not provided, the service will return a new id
         * @param {Object} params.poi The POI document that describes the POI to be created
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {String} The resource URI
         */
        createPOI: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredPOI(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'poi' + (params.id ? '/' + params.id : ''), token);

                    v.$.post(url, params.poi).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Update a poi.
         *
         * @memberOf voyent.locate
         * @alias updatePOI
         * @param {Object} params params
         * @param {String} params.id The poi id, the poi to be updated
         * @param {Object} params.poi The new poi
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        updatePOI: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredPOI(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'poi/' + params.id, token);

                    v.$.put(url, params.poi).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Searches for POIs in a realm based on a query.
         *
         * @memberOf voyent.locate
         * @alias findPOIs
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.query A mongo query for the points of interest
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findPOIs: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'poi', token, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        if (error.status === 404) {
                            resolve();
                        }
                        else {
                            reject(error);
                        }
                    });
                }
            );
        },

        /**
         * Delete a new POI.
         *
         * @memberOf voyent.locate
         * @alias deletePOI
         * @param {Object} params params
         * @param {String} params.id The POI id.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        deletePOI: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'poi/' + params.id, token);

                    v.$.doDelete(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetches all saved POIs for the realm.
         *
         * @memberOf voyent.locate
         * @alias getAllPOIs
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {Object} The results
         */
        getAllPOIs: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'poi', token);

                    v.$.getJSON(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Searches for locations in a realm based on a query.
         *
         * @memberOf voyent.locate
         * @alias findLocations
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.query A mongo query for the locations
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findLocations: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'locations', token, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        if (error.status === 404) {
                            resolve();
                        }
                        else {
                            reject(error);
                        }
                    });
                }
            );
        },

        /**
         * Update the location of the current user.
         *
         * @memberOf voyent.locate
         * @alias updateLocation
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.location The location
         */
        updateLocation: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredLocation(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'locations', token);

                    v.$.post(url, params.location).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Set the current users location with a latitude and longitude.
         *
         * @memberOf voyent.locate
         * @alias updateLocationCoordinates
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Number} params.lat The location latitude
         * @param {Number} params.lon The location longitude
         * @param {String} params.label An optional label
         */
        updateLocationCoordinates: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredLat(params, reject);
                    validateRequiredLon(params, reject);

                    var location = {
                        location: {
                            geometry: {
                                type: 'Point',
                                coordinates: [params.lon, params.lat]
                            },
                            properties: {
                                timestamp: new Date().toISOString()
                            }
                        }
                    };

                    if (params.label) {
                        location.label = params.label;
                    }

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'locations', token);

                    v.$.post(url, location).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Get the last known user location from the location service.
         *
         * @memberOf voyent.locate
         * @alias getLastUserLocation
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {String} params.username
         * @returns {Object} The single result, if any, of the user location.
         http://dev.voyent.cloud/locate/bsrtests/realms/test/locations
         ?access_token=4be2fc2f-a53b-4987-9446-88d519faaa77
         &query={%22username%22:%22user%22}
         &options={%22sort%22:[[%22lastUpdated%22,%22desc%22]]}
         &results=one
         var locationURL = apiURL + '/locations' +
         '?access_token=' + encodeURIComponent(bsr.auth.getCurrentToken()) +
         '&query={"username": "' + encodeURIComponent(user) + '"} +' +
         '&options={"sort":[["lastUpdated","desc"]]}' +
         '&results=one';
         */

        getLastUserLocation: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'locations/', token, {
                            "query": {"username": params.username},
                            "options": {"sort": {"lastUpdated": -1}, "limit": 1}
                        });

                    v.$.getJSON(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response[0] || null);
                    })['catch'](function (response) {
                        if (response.status === 403) {
                            resolve(null);
                        }
                        else {
                            reject(response);
                        }
                    });
                }
            );
        },

        /**
         * Delete a location.
         *
         * @memberOf voyent.locate
         * @alias deleteLocation
         * @param {Object} params params
         * @param {String} params.id The location id.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        deleteLocation: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'locations/' + params.id, token);

                    v.$.doDelete(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete locations based on a query.
         *
         * @memberOf voyent.locate
         * @alias deleteLocations
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.query A mongo query for the locations.
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set.
         * @param {Object} params.options Additional query options such as limit and sort.
         */
        deleteLocations: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'locations/', token, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.doDelete(url).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Create a new alert template.
         *
         * @memberOf voyent.location
         * @alias createAlertTemplate
         * @param {Object} params params
         * @param {String} params.id The alert template id. If not provided, the service will return a new id.
         * @param {Object} params.alertTemplate The alert template GeoJSON document.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {String} The resource URI
         */
        createAlertTemplate: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredAlertTemplate(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                              'alerts/' + (params.id ? encodeURIComponent(params.id) : ''), token);

                    v.$.post(url, params.alertTemplate).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Update an alert template.
         *
         * @memberOf voyent.location
         * @alias updateAlertTemplate
         * @param {Object} params params
         * @param {String} params.id The alert template id, the alert template to be updated.
         * @param {Object} params.alertTemplate The new alert template GeoJSON document.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        updateAlertTemplate: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredAlertTemplate(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'alerts/' + encodeURIComponent(params.id), token);

                    v.$.put(url, params.alertTemplate).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete an alert template.
         *
         * @memberOf voyent.location
         * @alias deleteAlertTemplate
         * @param {Object} params params
         * @param {String} params.id The id of alert template to be deleted.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        deleteAlertTemplate: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'alerts/' + encodeURIComponent(params.id), token);

                    v.$.doDelete(url).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Search for alert templates based on a query.
         *
         * @memberOf voyent.location
         * @alias findAlertTemplates
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.query A mongo query for the alert templates.
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findAlertTemplates: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    // Set 'nostore' to ensure the following checks don't update our lastKnown calls
                    params.nostore = true;

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'alerts', token, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        if (error.status === 404) {
                            resolve();
                        }
                        else {
                            reject(error);
                        }
                    });
                }
            );
        },

        /**
         * Create a new alert.
         *
         * @memberOf voyent.location
         * @alias createAlert
         * @param {Object} params params
         * @param {String} params.id The alert id. If not provided, the service will return a new id.
         * @param {Object} params.alert The alert GeoJSON document.
         * @param {Object} params.coordinates The alert coordinates in format [lng,lat].
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {String} The resource URI
         */
        createAlert: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredAlert(params, reject);
                    validateRequiredCoordinates(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'alerts/' + (params.id ? encodeURIComponent(params.id) : ''), token);

                    v.$.post(url,{"alert":params.alert,"coordinates":params.coordinates}).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Update an alert template.
         *
         * @memberOf voyent.location
         * @alias updateAlertTemplate
         * @param {Object} params params
         * @param {String} params.id The alert id, the alert template to be updated.
         * @param {Object} params.alert The new alert GeoJSON document.
         * @param {Object} params.coordinates The new alert coordinates in format [lng,lat].
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        updateAlert: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredAlert(params, reject);
                    validateRequiredCoordinates(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'alerts/' + encodeURIComponent(params.id), token);

                    v.$.put(url,{"alert":params.alert,"coordinates":params.coordinates}).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Deletes an alert instance.
         *
         * @memberOf voyent.location
         * @alias deleteAlert
         * @param {Object} params params
         * @param {String} params.id The id of the alert template that the instance was created from.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        deleteAlert: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'alerts/instances/' + encodeURIComponent(params.id), token);

                    v.$.doDelete(url).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Update the location of an alert.
         *
         * @memberOf voyent.locate
         * @alias updateAlertLocation
         * @param {Object} params params
         * @param {Object} params.location The location, must include the location.properties.alertId property.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        updateAlertLocation: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredLocation(params, reject);
                    validateRequiredAlertProperties(params, reject);
                    params.location.location.type = "Feature"; //Always set the GeoJSON type.

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'locations', token);

                    v.$.post(url, params.location).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Change the state of an alert.
         *
         * @memberOf voyent.locate
         * @alias updateAlertState
         * @param {Object} params params
         * @param {String} params.id The alert id, the alert whose state will be changed.
         * @param {Object} params.state The new alert state. One of draft, preview, active, deprecated, ended.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        updateAlertState: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredState(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'alerts/'+ encodeURIComponent(params.id)+'/state', token);

                    v.$.put(url, {"state":params.state}).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        getRegionResourcePermissions: function (params) {
            params.path = 'regions';
            return locate.getResourcePermissions(params);
        },

        updateRegionResourcePermissions: function (params) {
            params.path = 'regions';
            return locate.updateResourcePermissions(params);
        },

        getPOIResourcePermissions: function (params) {
            params.path = 'poi';
            return locate.getResourcePermissions(params);
        },

        updatePOIResourcePermissions: function (params) {
            params.path = 'poi';
            return locate.updateResourcePermissions(params);
        },

        getAlertResourcePermissions: function (params) {
            params.path = 'alert';
            return locate.getResourcePermissions(params);
        },

        updateAlertResourcePermissions: function (params) {
            params.path = 'alert';
            return locate.updateResourcePermissions(params);
        },

        getResourcePermissions: function (params) {
            params.service = 'locate';
            return v.getResourcePermissions(params);
        },

        updateResourcePermissions: function (params) {
            params.service = 'locate';
            return v.updateResourcePermissions(params);
        }
    };

    return locate;
}
function MailboxService(v, utils) {
    function validateRequiredMessages(params, reject) {
        utils.validateParameter('mailbox', 'The messages parameter is required', params, reject);
    }

    function validateRequiredConfig(params, reject) {
        utils.validateParameter('config', 'The config parameter is required', params, reject);
    }

    var mailbox = {
        /**
         * Create one or more messages for one or more users.
         *
         * @memberOf voyent.mailbox
         * @alias createMultiUserMessages
         * @param {Object} params params
         * @param {Array} params.messages The message(s) to be created.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         * @returns {String} The resource URI(s).
         */
        createMultiUserMessages: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredMessages(params, reject);

                    var url = utils.getRealmResourceURL(v.mailboxURL, account, realm,
                        'mailboxes', token);

                    v.$.post(url, params.messages).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uris);
                    })['catch'](function (error) {
                        reject(error);
                    });

                }
            );
        },

        /**
         * Create one or more messages for a specific user.
         *
         * @memberOf voyent.mailbox
         * @alias createMessages
         * @param {Object} params params
         * @param {Array} params.messages The message(s) to be created.
         * @param {String} params.username The user to create the message(s) for.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         * @returns {String} The resource URI(s).
         */
        createMessages: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredMessages(params, reject);
                    utils.validateRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(v.mailboxURL, account, realm,
                        'mailboxes/' + params.username + '/messages', token);

                    v.$.post(url, params.messages).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uris);
                    })['catch'](function (error) {
                        reject(error);
                    });

                }
            );
        },

        /**
         * Retrieve a single specific message for a specific user.
         *
         * @memberOf voyent.mailbox
         * @alias getMessage
         * @param {Object} params params
         * @param {String} params.id The message id, the message to fetch.
         * @param {String} params.username The user to create the message(s) for.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         * @returns {Object} The message.
         */
        getMessage: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    utils.validateRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(v.mailboxURL, account, realm,
                        'mailboxes/' + params.username + '/messages/' + params.id, token);

                    v.$.getJSON(url).then(function (message) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(message);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Retrieve messages for a specific user based on the results returned from query parameters. Optionally include
         * a type property to further refine the search.
         *
         * @memberOf voyent.mailbox
         * @alias findMessages
         * @param {Object} params params
         * @param {String} params.username The user to find message(s) for.
         * @param {String} params.type The type of messages to get. Valid options are "read" or "unread". Not required.
         * @param {Object} params.query A mongo query for the messages.
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set.
         * @param {Object} params.options Additional query options such as limit and sort.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         * @returns {Object} The results.
         */
        findMessages: function (params) {
            return new Promise(
                function (resolve, reject) {

                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(v.mailboxURL, account, realm,
                        'mailboxes/' + params.username + '/messages' + (params.type ? ('/type/' + params.type) : ''),
                        token, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function (messages) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(messages);
                    })['catch'](function (response) {
                        reject(response);
                    });

                }
            );
        },

        /**
         * Remove a single specific message for a specific user.
         *
         * @memberOf voyent.mailbox
         * @alias deleteMessage
         * @param {Object} params params
         * @param {String} params.id The message id, the message to delete.
         * @param {String} params.username The user to create the message(s) for.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         */
        deleteMessage: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    utils.validateRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(v.mailboxURL, account, realm,
                        'mailboxes/' + params.username + '/messages/' + params.id, token);

                    v.$.doDelete(url).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Remove messages for a specific user based on the results returned from query parameters. Optionally include a
         * type property to further refine the search.
         *
         * @memberOf voyent.mailbox
         * @alias deleteMessages
         * @param {Object} params params
         * @param {String} params.username The user to find message(s) for.
         * @param {String} params.type The type of messages to get. Valid options are "read" or "unread". Not required.
         * @param {Object} params.query A mongo query for the messages.
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set.
         * @param {Object} params.options Additional query options such as limit and sort.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         * @returns {Object} The results
         */
        deleteMessages: function (params) {
            return new Promise(
                function (resolve, reject) {

                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(v.mailboxURL, account, realm,
                        'mailboxes/' + params.username + '/messages' + (params.type ? ('/type/' + params.type) : ''),
                        token, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.doDelete(url).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Retrieve the configuration options for this service.
         *
         * @memberOf voyent.mailbox
         * @alias getConfig
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         * @returns {Object} The config
         */
        getConfig: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.mailboxURL, account, realm,
                        'config', token);

                    v.$.getJSON(url).then(function (config) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(config);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Update the configuration options for this service.
         *
         * @memberOf voyent.mailbox
         * @alias updateConfig
         * @param {Object} params params
         * @param {Object} params.config The new config.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         */
        updateConfig: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredConfig(params, reject);

                    var url = utils.getRealmResourceURL(v.mailboxURL, account, realm,
                        'config', token);

                    v.$.put(url, params.config).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        getMailboxResourcePermissions: function (params) {
            if (!params.username || params.username.length === 0) {
                return;
            }
            params.path = 'mailboxes/' + params.username + '/messages';
            return mailbox.getResourcePermissions(params);
        },

        updateMailboxResourcePermissions: function (params) {
            if (!params.username || params.username.length === 0) {
                return;
            }
            params.path = 'mailboxes/' + params.username + '/messages';
            return mailbox.getResourcePermissions(params);
        },

        getConfigResourcePermissions: function (params) {
            params.path = 'config';
            return mailbox.getResourcePermissions(params);
        },

        updateConfigResourcePermissions: function (params) {
            params.path = 'config';
            return mailbox.getResourcePermissions(params);
        },

        getResourcePermissions: function (params) {
            params.service = 'mailbox';
            return v.getResourcePermissions(params);
        },

        updateResourcePermissions: function (params) {
            params.service = 'mailbox';
            return v.updateResourcePermissions(params);
        }
    };

    return mailbox;
}
function ScopeService(v, utils) {
    function validateRequiredProperty(params, reject){
        utils.validateParameter('property', 'The property parameter is required', params, reject);
    }

    function validateRequiredData(params, reject){
        utils.validateParameter('data', 'The data parameter is required', params, reject);
    }


    return {
        /**
         * Create or update data stored within a realm scope.
         *
         * @memberOf voyent.scope
         * @alias createRealmData
         * @param {Object} params params
         * @param {Object} params.data The object containing one or more properties to be inserted into the realm scope.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         * @returns {String} The resource URI.
         */
        createRealmData: function(params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredData(params, reject);

                    var url = utils.getRealmResourceURL(v.scopeURL, account, realm,
                        'scopes/realm', token);

                    v.$.post(url, params.data).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Retrieve a single property stored in realm scope or the entire realm scope if no property is provided.
         *
         * @memberOf voyent.scope
         * @alias getRealmData
         * @param {Object} params params
         * @param {String} params.property The name of the data property to retrieve from realm scope. If not provided,
         * all data for the scope will be retrieved.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         * @returns {Object} The scoped data.
         */
        getRealmData: function(params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    // Set 'nostore' to ensure the following checks don't update our lastKnown calls
                    params.nostore = true;
                    
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var queryParams = {};
                    if (params.property) {
                        queryParams[params.property] = '';
                    }

                    var url = utils.getRealmResourceURL(v.scopeURL, account, realm,
                        'scopes/realm', token, queryParams);

                    v.$.getJSON(url).then(function (data) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(data);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete a single property stored in realm scope.
         *
         * @memberOf voyent.scope
         * @alias deleteRealmData
         * @param {Object} params params
         * @param {String} params.property The name of the data property to delete from realm scope. Required.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         */
        deleteRealmData: function(params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredProperty(params, reject);

                    var queryParams = {};
                    queryParams[params.property] = '';

                    var url = utils.getRealmResourceURL(v.scopeURL, account, realm,
                        'scopes/realm', token, queryParams);

                    v.$.doDelete(url).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete an entire realm scope and all of it's data. Use with care, this action cannot be undone.
         *
         * @memberOf voyent.scope
         * @alias deleteRealmScope
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         */
        deleteRealmScope: function(params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var queryParams = {"_invalidate":''};

                    var url = utils.getRealmResourceURL(v.scopeURL, account, realm,
                        'scopes/realm', token, queryParams);

                    v.$.doDelete(url).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Create or update data stored within a user scope.
         *
         * @memberOf voyent.scope
         * @alias createUserData
         * @param {Object} params params
         * @param {Object} params.id The user id, the user scope to create data in.
         * @param {Object} params.data The object containing one or more properties to be inserted into the user scope.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         * @returns {String} The resource URI.
         */
        createUserData: function(params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredData(params, reject);

                    var url = utils.getRealmResourceURL(v.scopeURL, account, realm,
                        'scopes/user/' + params.id, token);

                    v.$.post(url, params.data).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Retrieve a single property stored in user scope or the entire user scope if no property is provided.
         *
         * @memberOf voyent.scope
         * @alias getUserData
         * @param {Object} params params
         * @param {Object} params.id The user id, the user scope to get data from.
         * @param {String} params.property The name of the data property to retrieve from user scope. If not provided,
         * all data for the scope will be retrieved.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         * @returns {Object} The scoped data.
         */
        getUserData: function(params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var queryParams = {};
                    if (params.property) {
                        queryParams[params.property] = '';
                    }

                    var url = utils.getRealmResourceURL(v.scopeURL, account, realm,
                        'scopes/user/' + params.id, token, queryParams);

                    v.$.getJSON(url).then(function (data) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(data);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete a single property stored in user scope.
         *
         * @memberOf voyent.scope
         * @alias deleteUserData
         * @param {Object} params params
         * @param {Object} params.id The user id, the user scope to delete data from.
         * @param {String} params.property The name of the data property to delete from user scope. Required.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         */
        deleteUserData: function(params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredProperty(params, reject);

                    var queryParams = {};
                    queryParams[params.property] = '';

                    var url = utils.getRealmResourceURL(v.scopeURL, account, realm,
                        'scopes/user/' + params.id, token, queryParams);

                    v.$.doDelete(url).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete an entire user scope and all of it's data. Use with care, this action cannot be undone.
         *
         * @memberOf voyent.scope
         * @alias deleteUserScope
         * @param {Object} params params
         * @param {Object} params.id The user id, the user scope to delete.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         */
        deleteUserScope: function(params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var queryParams = {"_invalidate":''};

                    var url = utils.getRealmResourceURL(v.scopeURL, account, realm,
                        'scopes/user/' + params.id, token, queryParams);

                    v.$.doDelete(url).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Create or update data stored within a process scope.
         *
         * @memberOf voyent.scope
         * @alias createProcessData
         * @param {Object} params params
         * @param {Object} params.id The process id, the process scope to create data in.
         * @param {Object} params.data The object containing one or more properties to be inserted into the process
         * scope.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         * @returns {String} The resource URI.
         */
        createProcessData: function(params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredData(params, reject);

                    var url = utils.getRealmResourceURL(v.scopeURL, account, realm,
                        'scopes/process/' + params.id, token);

                    v.$.post(url, params.data).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Retrieve a single property stored in process scope or the entire process scope if no property is provided.
         *
         * @memberOf voyent.scope
         * @alias getProcessData
         * @param {Object} params params
         * @param {Object} params.id The process id, the process scope to get data from.
         * @param {String} params.property The name of the data property to retrieve from process scope. If not
         * provided, all data for the scope will be retrieved.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         * @returns {Object} The scoped data.
         */
        getProcessData: function(params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var queryParams = {};
                    if (params.property) {
                        queryParams[params.property] = '';
                    }

                    var url = utils.getRealmResourceURL(v.scopeURL, account, realm,
                        'scopes/process/' + params.id, token, queryParams);

                    v.$.getJSON(url).then(function (data) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(data);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete a single property stored in process scope.
         *
         * @memberOf voyent.scope
         * @alias deleteProcessData
         * @param {Object} params params
         * @param {Object} params.id The process id, the process scope to delete data from.
         * @param {String} params.property The name of the data property to delete from process scope. Required.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         */
        deleteProcessData: function(params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredProperty(params, reject);

                    var queryParams = {};
                    queryParams[params.property] = '';

                    var url = utils.getRealmResourceURL(v.scopeURL, account, realm,
                        'scopes/process/' + params.id, token, queryParams);

                    v.$.doDelete(url).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete an entire process scope and all of it's data. Use with care, this action cannot be undone.
         *
         * @memberOf voyent.scope
         * @alias deleteProcessScope
         * @param {Object} params params
         * @param {Object} params.id The process id, the process scope to delete.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         */
        deleteProcessScope: function(params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var queryParams = {"_invalidate":''};

                    var url = utils.getRealmResourceURL(v.scopeURL, account, realm,
                        'scopes/process/' + params.id, token, queryParams);

                    v.$.doDelete(url).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Create or update data stored within a transaction scope.
         *
         * @memberOf voyent.scope
         * @alias createTransactionData
         * @param {Object} params params
         * @param {Object} params.id The transaction id, the transaction scope to create data in.
         * @param {Object} params.data The object containing one or more properties to be inserted into the transaction
         * scope.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         * @returns {String} The resource URI.
         */
        createTransactionData: function(params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredData(params, reject);

                    var url = utils.getRealmResourceURL(v.scopeURL, account, realm,
                        'scopes/transaction/' + params.id, token);

                    v.$.post(url, params.data).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Retrieve a single property stored in transaction scope or the entire transaction scope if no property is
         * provided.
         *
         * @memberOf voyent.scope
         * @alias getTransactionData
         * @param {Object} params params
         * @param {Object} params.id The transaction id, the transaction scope to get data from.
         * @param {String} params.property The name of the data property to retrieve from transaction scope. If not
         * provided, all data for the scope will be retrieved.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         * @returns {Object} The scoped data.
         */
        getTransactionData: function(params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var queryParams = {};
                    if (params.property) {
                        queryParams[params.property] = '';
                    }

                    var url = utils.getRealmResourceURL(v.scopeURL, account, realm,
                        'scopes/transaction/' + params.id, token, queryParams);

                    v.$.getJSON(url).then(function (data) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(data);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete a single property stored in transaction scope.
         *
         * @memberOf voyent.scope
         * @alias deleteTransactionData
         * @param {Object} params params
         * @param {Object} params.id The transaction id, the transaction scope to delete data from.
         * @param {String} params.property The name of the data property to delete from transaction scope. Required.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         */
        deleteTransactionData: function(params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredProperty(params, reject);

                    var queryParams = {};
                    queryParams[params.property] = '';

                    var url = utils.getRealmResourceURL(v.scopeURL, account, realm,
                        'scopes/transaction/' + params.id, token, queryParams);

                    v.$.doDelete(url).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete an entire transaction scope and all of it's data. Use with care, this action cannot be undone.
         *
         * @memberOf voyent.scope
         * @alias deleteTransactionScope
         * @param {Object} params params
         * @param {Object} params.id The transaction id, the transaction scope to delete.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         */
        deleteTransactionScope: function(params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var queryParams = {"_invalidate":''};

                    var url = utils.getRealmResourceURL(v.scopeURL, account, realm,
                        'scopes/transaction/' + params.id, token, queryParams);

                    v.$.doDelete(url).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Touch a transaction scope. Touching a scope updates the last accessed time without changing anything else.
         *
         * @memberOf voyent.scope
         * @alias touchTransactionScope
         * @param {Object} params params
         * @param {String} params.id The transaction id, the transaction scope to touch.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         * will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         * will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         * voyent.auth.connect() will be used.
         * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
         * default will be used.
         */
        touchTransactionScope: function(params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.scopeURL, account, realm,
                        'scopes/transaction/' + params.id, token);

                    v.$.put(url).then(function(){
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        }
    };
}function MetricsService(v, utils) {
    function validateRequiredEvent(params, reject){
        utils.validateParameter('event', 'The event parameter is required', params, reject);
    }
    
    return {

        /**
         * Searches for events in a realm based on a query
         *
         * @memberOf voyent.metrics
         * @alias findEvents
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.io.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.query A mongo query for the events
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findEvents: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.metricsURL, account, realm,
                        'events', token, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function(events){
                        v.auth.updateLastActiveTimestamp();
                        resolve(events);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Store a custom event in the event service.
         *
         * @memberOf voyent.metrics
         * @alias createCustomEvent
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.io.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.event The custom event that you would like to store, in JSON format.
         * @returns {String} The resource URI
         */
        createCustomEvent: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredEvent(params, reject);

                    var url = utils.getRealmResourceURL(v.metricsURL, account, realm,
                        'events', token);

                    v.$.post(url, params.event).then(function(response){
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Retrieve the time difference in milliseconds between the provided time and the event server time.
         *
         * Useful for displaying accurate live metrics views. The time difference is returned as client time - server
         * time.
         *
         * @memberOf voyent.metrics
         * @alias getClientServerTimeGap
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.io.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {Number} The time difference in milliseconds
         */
        getClientServerTimeGap: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.metricsURL, account, realm,
                        'time', token, {
                            clientTime: encodeURIComponent(new Date().toISOString())
                        });

                    v.$.getJSON(url).then(function(response){
                        if( response.timeOffset){
                            v.auth.updateLastActiveTimestamp();
                            resolve(response.timeOffset);
                        }
                        else{
                            reject(new Error('getClientServerTimeGap() could not parse response: ' +
                                JSON.stringify(response)));
                        }
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        }
    };
}
function EventService(v, utils) {
    function validateRequiredEvent(params, reject){
        utils.validateParameter('event', 'The event parameter is required', params, reject);
    }

    var eventArray = [];
    var eventsRunning;
    var runningIndex = 0;
    var eventIndex = 0;

    return {
        /**
         * Searches for events in a realm based on a query
         *
         * @memberOf voyent.event
         * @alias findEvents
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.query A mongo query for the events
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findEvents: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.eventURL, account, realm,
                        'events', token, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function (events) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(events);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Store a custom event in the event service.
         *
         * @memberOf voyent.event
         * @alias createCustomEvent
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.event The custom event that you would like to store, in JSON format.
         * @returns {String} The resource URI
         */
        createCustomEvent: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredEvent(params, reject);

                    var url = utils.getRealmResourceURL(v.eventURL, account, realm,
                        'events', token);

                    v.$.post(url, params.event).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Store an array of custom events in the event service.
         *
         * @memberOf voyent.event
         * @alias createCustomEvents.
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account will
         *     be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name will
         *     be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.eventArray An array of events that you want to fire. Events should include a 'delay'
         *     property, with the number of milliseconds to wait since the last event before firing.
         */

        createCustomEvents: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var url = utils.getRealmResourceURL(v.eventURL, account, realm,
                        'events', token);

                    eventArray = params.eventArray;
                    eventsRunning = true;
                    runningIndex += 1;
                    eventIndex = 0;
                    v.event._eventRecursion(resolve, reject, url, runningIndex);
                }
            );
        },
        /**
         * Convenience method to reduce code-reuse.
         */
        _eventRecursion: function (resolve, reject, url, index) {
            //if no url is provided then generate the URL using the latest account/realm/token
            if (!url) {
                url = utils.getRealmResourceURL(v.eventURL, v.auth.getLastKnownAccount(), v.auth.getLastKnownRealm(),
                    'events', v.auth.getLastAccessToken());
            }
            if (index === runningIndex) {
                setTimeout(function () {
                    if (index === runningIndex) {
                        var date = new Date();
                        v.$.post(url, eventArray[eventIndex]).then(function (response) {
                            v.auth.updateLastActiveTimestamp();
                            if (eventIndex === eventArray.length - 1) {
                                resolve();
                            }
                            else {
                                eventIndex += 1;
                                v.event._eventRecursion(resolve, reject, null, index);
                            }
                        })['catch'](function (error) {
                            reject(error);
                        });
                    }
                }, eventArray[eventIndex].delay)
            }
        },

        /**
         * Convenience method for stopping multiple events midway through
         *
         * @memberOf voyent.event
         * @alias stopEvents.
         */
        stopEvents: function () {
            eventsRunning = false;
            runningIndex += 1;
        },


        /**
         * Restart a previously paused event array
         *
         * @memberOf voyent.event
         * @alias restartEvents.
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account will
         *     be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name will
         *     be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        restartEvents: function (params) {
            eventsRunning = true;
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var url = utils.getRealmResourceURL(v.eventURL, account, realm,
                        'events', token);
                    v.event._eventRecursion(resolve, reject, url, runningIndex);
                }
            );
        },

        /**
         * Convenience method for getting the total number of events being process
         *
         * @memberOf voyent.event
         * @alias getEventsSize.
         */
        getEventsSize: function () {
            return eventArray.length;
        },

        /**
         * Convenience method for getting the currently running event
         *
         * @memberOf voyent.event
         * @alias getCurrentEvent.
         */
        getCurrentEvent: function () {
            return eventIndex + 1;
        },
        /**
         * Retrieve the time difference in milliseconds between the provided time and the event server time.
         *
         * Useful for displaying accurate live event views. The time difference is returned as client time - server
         * time.
         *
         * @memberOf voyent.event
         * @alias getClientServerTimeGap
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {Number} The time difference in milliseconds
         */
        getClientServerTimeGap: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.eventURL, account, realm,
                        'time', token, {
                            clientTime: encodeURIComponent(new Date().toISOString())
                        });

                    v.$.getJSON(url).then(function (response) {
                        if (response.timeOffset) {
                            v.auth.updateLastActiveTimestamp();
                            resolve(response.timeOffset);
                        }
                        else {
                            reject(new Error('getClientServerTimeGap() could not parse response: ' +
                                JSON.stringify(response)));
                        }
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        }
    };
}function PushService(v, utils) {
    function validateRequiredGroup(params, reject) {
        utils.validateParameter('group', 'The group parameter is required', params, reject);
    }

    function validateRequiredCallback(params, reject) {
        utils.validateParameter('group', 'The callback parameter is required', params, reject);
    }

    var pushKeys = {
        PUSH_CALLBACKS_KEY: 'pushCallbacks'
    };

    function storePushListener(pushId, group, cb) {
        var pushListeners = {};
        var pushListenersStr = utils.getSessionStorageItem(pushKeys.PUSH_CALLBACKS_KEY);
        if (pushListenersStr) {
            try {
                pushListeners = JSON.parse(pushListenersStr);
            } catch (e) {
            }
        }
        if (!pushListeners[group]) {
            pushListeners[group] = [];
        }
        pushListeners[group].push({pushId: pushId, callback: cb});
        utils.setSessionStorageItem(pushKeys.PUSH_CALLBACKS_KEY, JSON.stringify(pushListeners));
    }

    return {

        /**
         * Connect to the Voyent Push Service
         *
         * @alias startPushService
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name will be used.
         * @param {String} params.cloudPushURI If provided, Cloud Push notifications will be enabled.
         */
        startPushService: function (params) {

            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var pushURL = v.pushURL + '/';

                    function notifyBack() {
                        if (params.cloudPushURI) {
                            window.ice.push.addNotifyBackURI(params.cloudPushURI, resolve);
                        } else {
                            resolve();
                        }
                    }
                    //make sure the ICEpush code is evaluated before this
                    window.ice.push = ice.setupPush({
                        'uri': pushURL,
                        'account': account,
                        'realm': realm,
                        'access_token': token
                    }, notifyBack);

                    console.log('voyent.push.connect() connected');
                }
            );
        },


        /**
         * Add listener for notifications belonging to the specified group.
         * Callbacks must be passed by name to receive cloud push notifications.
         *
         * @alias addPushListener
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name will be used.
         * @param {String} params.group The push group name
         * @param {String} params.callback The callback function to be called on the push event
         */
        addPushListener: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                validateRequiredGroup(params, reject);
                validateRequiredCallback(params, reject);

                if (ice && ice.push) {
                    ice.push.createPushId(function (pushId) {
                        ice.push.addGroupMember(params.group, pushId, true, function() {
                            var fn = utils.findFunctionInGlobalScope(params.callback);
                            if (!fn) {
                                reject('could not find function in global scope: ' + params.callback);
                            } else {
                                ice.push.register([pushId], fn);
                                storePushListener(pushId, params.group, params.callback);
                                resolve();
                            }
                        });
                    });
                    console.log('voyent.push.addPushListener() added listener to group ' + params.group);
                } else {
                    reject('Push service is not active');
                }
            });
        },

        /**
         * Remove listener for notifications belonging to the specified group.
         * Callbacks must be passed by name to receive cloud push notifications.
         *
         * @alias removePushListener
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name will be used.
         * @param {String} params.group The push group name
         * @param {String} params.callback The callback function to be called on the push event. This parameter is optional, when missing
         * all callbacks within the group are removed.
         */
        removePushListener: function (params) {
            return new Promise(function (resolve, reject) {
                console.log('voyent.push.removePushListener() group: ' + params.group);
                params = params ? params : {};
                validateRequiredGroup(params, reject);
                var pushListenersStr = utils.getSessionStorageItem(pushKeys.PUSH_CALLBACKS_KEY);
                if (!pushListenersStr) {
                    console.error('Cannot remove push listener ' + params.group + ', missing push listener storage.');
                    reject('Cannot remove push listener ' + params.group + ', missing push listener storage.');
                }
                else {
                    try {
                        var pushListenerStorage = JSON.parse(pushListenersStr);
                        var listeners = pushListenerStorage[params.group];
                        console.log('found push listeners in storage: ' + ( listeners ? JSON.stringify(listeners) : null ));
                        if (!listeners) {
                            console.error('could not find listeners for group ' + params.group);
                            reject('could not find listeners for group ' + params.group);
                            return;
                        }
                        if (params.callback) {
                            //remove only the listener/pushId corresponding to the provided callback
                            var remainingListeners = [];
                            for (var i = 0; i < listeners.length; i++) {
                                var listener = listeners[i];
                                if (listener.callback == params.callback) {
                                    var pushId = listener.pushId;
                                    ice.push.removeGroupMember(params.group, pushId);
                                    ice.push.deregister(pushId);
                                    console.log('removed push id ' + pushId);
                                } else {
                                    remainingListeners.push(listener);
                                }

                                if (remainingListeners.length > 0) {
                                    pushListenerStorage[params.group] = remainingListeners;
                                } else {
                                    delete pushListenerStorage[params.group];
                                }
                            }
                        } else {
                            //remove all the listeners for the group
                            for (var i = 0; i < listeners.length; i++) {
                                var pushId = listeners[i].pushId;
                                ice.push.removeGroupMember(params.group, pushId);
                                ice.push.deregister(pushId);
                                console.log('removed push id ' + pushId);
                            }
                            delete pushListenerStorage[params.group];
                        }
                        utils.setSessionStorageItem(pushKeys.PUSH_CALLBACKS_KEY, JSON.stringify(pushListenerStorage));
                        resolve();
                    } catch (e) {
                        console.error(e);
                        reject(e);
                    }
                }

            });
        },

        /**
         * Push notification to a push group.
         *
         * This will result in an Ajax Push (and associated callback)
         * to any web pages that have added a push listener to the
         * specified group.  If Cloud Push options are provided
         * (params.subject and params.detail) a Cloud Push will
         * be dispatched as a home screen notification to any devices
         * unable to recieve the Ajax Push via the web page.
         *
         * @alias sendPushEvent
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name will be used.
         * @param {String} params.group The push group name
         * @param {String} params.message The message is the push notification configuration
         *
         * @example
         * sendPushEvent({
         *      account: "<account>",
         *      realm: "<realm>",
         *      group: "<group>",
         *      message: {
         *           "cloud_notification_forced": <boolean>,
         *           "global": {
         *              "detail": "<detail-string>",
         *               "expire_time": <long>,
         *               "icon": "<url-string>",
         *               "payload": {},
         *               "priority": "<string>",
         *               "subject": "<subject-string>",
         *               "url": "<url-string>"
         *           },
         *           "cloud": {
         *               "detail": "<detail-string>",
         *               "expire_time": <long>,
         *               "icon": "<url-string>",
         *               "payload": {},
         *               "priority": "<string>",
         *               "subject": "<subject-string>",
         *               "url": "<url-string>"
         *           }
         *       }
         * });
         */
        sendPushEvent: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    validateRequiredGroup(params, reject);

                    if (ice && ice.push) {
                        ice.push.notify(params.group, params.message);
                        resolve();
                    } else {
                        reject('Push service is not active');
                    }
                }
            );
        }
    };
}
function CloudService(v, utils) {
    return {
        /**
         * Push cloud notification to a given notify-back URI.
         *
         * @alias pushToNotifyBackURI
         * @param {String} notifyBackURI
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name will be used.
         * @param {String} params.message The message is the cloud notification.
         *
         * @example
         * sendPushEvent({
         *      account: "<account>",
         *      realm: "<realm>",
         *      message: {
         *           "asynchronous": <boolean>,
         *           "global": {
         *              "detail": "<detail-string>",
         *               "expire_time": <long>,
         *               "icon": "<url-string>",
         *               "payload": {},
         *               "priority": "<string>",
         *               "subject": "<subject-string>",
         *               "url": "<url-string>"
         *           },
         *           "cloud": {
         *               "detail": "<detail-string>",
         *               "expire_time": <long>,
         *               "icon": "<url-string>",
         *               "payload": {},
         *               "priority": "<string>",
         *               "subject": "<subject-string>",
         *               "url": "<url-string>"
         *           }
         *           ....
         *       }
         * });
         */
        pushToNotifyBackURI: function (notifyBackURI, params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.cloudURL, account, realm,
                        'notify-back-uris/' + notifyBackURI, token);

                    v.$.post(url, params.message).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(url);
                    })['catch'](function (error) {
                        reject(error);
                    });

                }
            );
        },

        /**
         * Push cloud notification to a given list of notify-back URIs.
         *
         * @alias pushToNotifyBackURI
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name will be used.
         * @param {String} params.message The message is the cloud notification.
         *
         * @example
         * sendPushEvent({
         *      account: "<account>",
         *      realm: "<realm>",
         *      message: {
         *           "asynchronous": <boolean>,
         *           "notify_back_uris": [
         *              "<notify-back-uri>",
         *              "<notify-back-uri>",
         *              ...
         *           ]
         *           "global": {
         *              "detail": "<detail-string>",
         *               "expire_time": <long>,
         *               "icon": "<url-string>",
         *               "payload": {},
         *               "priority": "<string>",
         *               "subject": "<subject-string>",
         *               "url": "<url-string>"
         *           },
         *           "cloud": {
         *               "detail": "<detail-string>",
         *               "expire_time": <long>,
         *               "icon": "<url-string>",
         *               "payload": {},
         *               "priority": "<string>",
         *               "subject": "<subject-string>",
         *               "url": "<url-string>"
         *           }
         *           ....
         *       }
         * });
         */
        pushToNotifyBackURIs: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.cloudURL, account, realm,
                        'notify-back-uris/', token);

                    v.$.post(url, params.message).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(url);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        }
    };
}
function QueryService(v, utils) {
    function validateRequiredQuery(params, reject){
        utils.validateParameter('query', 'The query parameter is required', params, reject);
    }

    function validateRequiredTransformer(params, reject){
        utils.validateParameter('transformer', 'The transformer parameter is required', params, reject);
    }

    var query = {
        /**
         * Create a new query.
         *
         * @memberOf voyent.query
         * @alias createQuery
         * @param {Object} params params
         * @param {String} params.id The query id. If not provided, the service will return a new id
         * @param {Object} params.query The query to be created
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {String} The resource URI
         */
        createQuery: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredQuery(params, reject);

                    var url = utils.getRealmResourceURL(v.queryURL, account, realm,
                        'queries/' + (params.id ? params.id : ''), token);

                    v.$.post(url, params.query).then(function(response){
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function(error){
                        reject(error);
                    });

                }
            );
        },

        /**
         * Update a query.
         *
         * @memberOf voyent.query
         * @alias updateQuery
         * @param {Object} params params
         * @param {String} params.id The query id, the query to be updated
         * @param {Object} params.query The query
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {String} The resource URI
         */
        updateQuery: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredQuery(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.queryURL, account, realm,
                        'queries/' + params.id, token);

                    v.$.put(url, params.query).then(function(response){
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetch a query.
         *
         * @memberOf voyent.query
         * @alias getQuery
         * @param {Object} params params
         * @param {String} params.id The query id, the query to fetch
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {Object} The query
         */
        getQuery: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.queryURL, account, realm,
                        'queries/' + params.id, token);

                    v.$.getJSON(url).then(function(query){
                        v.auth.updateLastActiveTimestamp();
                        resolve(query);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Searches for queries in a realm based on a query.
         *
         * @memberOf voyent.query
         * @alias findQueries
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.query A mongo query for the queries
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findQueries: function(params){
            return new Promise(
                function(resolve, reject) {

                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.queryURL, account, realm,
                        'queries/', token, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function(doc){
                        v.auth.updateLastActiveTimestamp();
                        resolve(doc);
                    })['catch'](function(response){
                        reject(response);
                    });

                }
            );
        },

        /**
         * Delete a query.
         *
         * @memberOf voyent.query
         * @alias deleteQuery
         * @param {Object} params params
         * @param {String} params.id The query id, the query to be deleted
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        deleteQuery: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.queryURL, account, realm,
                        'queries/' + params.id, token);

                    v.$.doDelete(url).then(function(response){
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Create a new transformer.
         *
         * @memberOf voyent.query
         * @alias createTransformer
         * @param {Object} params params
         * @param {String} params.id The transformer id. If not provided, the service will return a new id
         * @param {Object} params.transformer The transformer to be created
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {String} The resource URI
         */
        createTransformer: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredTransformer(params, reject);

                    var url = utils.getRealmResourceURL(v.queryURL, account, realm,
                        'transformers/' + (params.id ? params.id : ''), token);

                    v.$.post(url, params.transformer).then(function(response){
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function(error){
                        reject(error);
                    });

                }
            );
        },

        /**
         * Update a transformer.
         *
         * @memberOf voyent.query
         * @alias updateTransformer
         * @param {Object} params params
         * @param {String} params.id The transformer id, the transformer to be updated
         * @param {Object} params.transformer The transformer
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {String} The resource URI
         */
        updateTransformer: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredTransformer(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.queryURL, account, realm,
                        'transformers/' + params.id, token);

                    v.$.put(url, params.transformer).then(function(response){
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetch a transformer.
         *
         * @memberOf voyent.query
         * @alias getTransformer
         * @param {Object} params params
         * @param {String} params.id The transformer id, the transformer to fetch
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {Object} The transformer
         */
        getTransformer: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.queryURL, account, realm,
                        'transformers/' + params.id, token);

                    v.$.getJSON(url).then(function(transformer){
                        v.auth.updateLastActiveTimestamp();
                        resolve(transformer);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Searches for transformers in a realm based on a transformer.
         *
         * @memberOf voyent.query
         * @alias findTransformers
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.transformer A mongo transformer for the transformers
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional transformer options such as limit and sort
         * @returns {Object} The results
         */
        findTransformers: function(params){
            return new Promise(
                function(resolve, reject) {

                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.queryURL, account, realm,
                        'transformers/', token, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function(transformers){
                        v.auth.updateLastActiveTimestamp();
                        resolve(transformers);
                    })['catch'](function(response){
                        reject(response);
                    });

                }
            );
        },

        /**
         * Delete a transformer.
         *
         * @memberOf voyent.query
         * @alias deleteTransformer
         * @param {Object} params params
         * @param {String} params.id The transformer id, the transformer to be deleted
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        deleteTransformer: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.queryURL, account, realm,
                        'transformers/' + params.id, token);

                    v.$.doDelete(url).then(function(response){
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Execute a query or query chain.
         *
         * @memberOf voyent.query
         * @alias executeQuery
         * @param {Object} params params
         * @param {String} params.id The query/chain id, the query or query chain to be executed
         * @param {Object} params.execParams Execution parameters that will be passed into parameterized query fields
         * @param {String} params.mode Specify "debug" to return step-by-step query execution data
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {Object} The results
         */
        executeQuery: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var queryParams = {'exec': 'true'};
                    queryParams.execParams = (params.execParams ? params.execParams : {});
                    if (params.mode) {
                        queryParams.mode = params.mode;
                    }

                    var url = utils.getRealmResourceURL(v.queryURL, account, realm,
                        'queries/' + params.id, token, queryParams);

                    v.$.getJSON(url).then(function(results){
                        v.auth.updateLastActiveTimestamp();
                        resolve(results);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        getQueryResourcePermissions: function(params){
            params.path = 'queries';
            return query.getResourcePermissions(params);
        },

        updateQueryResourcePermissions: function(params){
            params.path = 'queries';
            return query.getResourcePermissions(params);
        },

        getTransformerResourcePermissions: function(params){
            params.path = 'transformers';
            return query.getResourcePermissions(params);
        },

        updateTransformerResourcePermissions: function(params){
            params.path = 'transformers';
            return query.getResourcePermissions(params);
        },

        getResourcePermissions: function(params){
            params.service = 'query';
            return v.getResourcePermissions(params);
        },

        updateResourcePermissions: function(params){
            params.service = 'query';
            return v.updateResourcePermissions(params);
        }
    };

    return query;
}
function StorageService(v, utils) {
    function validateRequiredBlob(params, reject){
        utils.validateParameter('blob', 'The blob parameter is required', params, reject);
    }

    function validateRequiredFile(params, reject){
        utils.validateParameter('file', 'The file parameter is required', params, reject);
    }

    var storage = {

        /**
         * Retrieve the storage meta info for the realm
         *
         * @memberOf voyent.storage
         * @alias getMetaInfo
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {String} params.scope (default 'self') 'all' or 'self', return meta information for blobs belonging
         *     to all users, or only those belonging to the current user
         * @returns {Object} The results
         */
        getMetaInfo: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.storageURL, account, realm,
                    'meta', token, params.scope ? {scope: params.scope} : null);


                v.$.getJSON(url).then(function(response){
                    v.auth.updateLastActiveTimestamp();
                    resolve(response.directory);
                })['catch'](function(error){
                    reject(error);
                });
            });
        },

        /**
         * Stores a blob
         *
         * @memberOf voyent.storage
         * @alias uploadBlob
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.id The blob id. If not provided, the service will return a new id
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.blob The Blob to store
         * @param {Function} params.progressCallback The callback function to call on progress events. eg. function
         *     progressCallback(percentComplete, xhr){..}
         * @returns {Object} The results
         */
        uploadBlob: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                validateRequiredBlob(params, reject);

                var formData = new FormData();
                formData.append('file', params.blob);

                var url = utils.getRealmResourceURL(v.storageURL, account, realm,
                    'blobs' + (params.id ? '/' + params.id : ''), token);

                v.$.post(url, formData, null, true, null, params.progressCallback).then(function(response){
                    v.auth.updateLastActiveTimestamp();
                    resolve(response.location || response.uri);
                })['catch'](function(error){
                    reject(error);
                });
            });
        },

        /**
         * Stores a file
         *
         * @memberOf voyent.storage
         * @alias uploadBlob
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.id The blob id. If not provided, the service will return a new id
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.file The Blob to store
         * @param {Function} params.progressCallback The callback function to call on progress events. eg. function
         *     progressCallback(percentComplete, xhr){..}
         * @param {Function} params.onabort The callback for the XMLHttpRequest onabort event
         * @param {Function} params.onerror The callback for the XMLHttpRequest onerror event
         * @returns {Object} The results
         */
        uploadFile: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                validateRequiredFile(params, reject);

                var url = utils.getRealmResourceURL(v.storageURL, account, realm,
                    'blobs' + (params.id ? '/' + params.id : ''), token);
                var formData = new FormData();
                formData.append('file', params.file);

                v.$.post(url, formData, null, true, null, params.progressCallback, params.onabort, params.onerror).then(function(response){
                    v.auth.updateLastActiveTimestamp();
                    resolve(response.location || response.uri);
                })['catch'](function(error){
                    reject(error);
                });
            });
        },

        /**
         * Retrieves a blob file from the storage service
         *
         * @memberOf voyent.storage
         * @alias getBlob
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.id The blob id.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @returns {Object} The blob arraybuffer
         */
        getBlob: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateRequiredId(params, reject);

                var url = utils.getRealmResourceURL(v.storageURL, account, realm,
                    'blobs/' + params.id, token);

                v.$.getBlob(url).then(function(response){
                    v.auth.updateLastActiveTimestamp();
                    resolve(response);
                })['catch'](function(error){
                    reject(error);
                });
            });
        },

        /**
         * Deletes a blob file from the storage service
         *
         * @memberOf voyent.storage
         * @alias deleteBlob
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.id The blob id.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         */
        deleteBlob: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateRequiredId(params, reject);

                var url = utils.getRealmResourceURL(v.storageURL, account, realm,
                    'blobs/' + params.id, token);

                v.$.doDelete(url).then(function(response){
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function(error){
                    reject(error);
                });
            });
        },

        getBlobResourcePermissions: function(params){
            params.path = 'blobs';
            return storage.getResourcePermissions(params);
        },

        updateBlobResourcePermissions: function(params){
            params.path = 'blobs';
            return storage.getResourcePermissions(params);
        },

        getResourcePermissions: function(params){
            params.service = 'storage';
            return v.getResourcePermissions(params);
        },

        updateResourcePermissions: function(params){
            params.service = 'storage';
            return v.updateResourcePermissions(params);
        }
    };

    return storage;
}
function PrivateUtils(services, keys) {

    function validateRequiredRealm(params, reject) {
        validateParameter('realm', 'The Voyent realm is required', params, reject);
    }

    function validateAndReturnRequiredAccessToken(params, reject) {
        var token = params.accessToken || services.auth.getLastAccessToken();
        if (token) {
            return token;
        }
        else {
            return reject(Error('A Voyent access token is required'));
        }
    }

    function validateAndReturnRequiredRealmName(params, reject) {
        var realm = params.realmName;
        if (realm) {
            realm = encodeURI(realm);
        } else {
            realm = services.auth.getLastKnownRealm();
        }
        if (realm) {
            if (!params.nostore) {
                setSessionStorageItem(btoa(keys.REALM_KEY), btoa(realm));
            }
            return realm;
        } else {
            return reject(Error('The Voyent realm is required'));
        }
    }

    function validateAndReturnRequiredRealm(params, reject) {
        var realm = params.realm;
        if (realm) {
            realm = encodeURI(realm);
        }
        else {
            realm = services.auth.getLastKnownRealm();
        }
        if (realm) {
            if (!params.nostore) {
                setSessionStorageItem(btoa(keys.REALM_KEY), btoa(realm));
            }
            return realm;
        }
        else {
            return reject(Error('The Voyent realm is required'));
        }
    }

    function validateAndReturnRequiredAccount(params, reject) {
        var account = params.account;
        if (account) {
            account = encodeURI(account);
        } else {
            account = services.auth.getLastKnownAccount();
        }
        if (account) {
            if (!params.nostore) {
                setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(account));
            }
            return account;
        } else {
            return reject(Error('The Voyent account is required'));
        }
    }

    function validateAndReturnRequiredUsername(params, reject) {
        var username = params.username;
        if (!username) {
            username = services.auth.getLastKnownUsername();
        }
        if (username) {
            if (!params.nostore) {
                setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(username));
            }
            return username;
        } else {
            return reject(Error('The Voyent username is required'));
        }
    }

    function validateRequiredUsername(params, reject) {
        validateParameter('username', 'The username parameter is required', params, reject);
    }

    function validateRequiredPassword(params, reject) {
        validateParameter('password', 'The password parameter is required', params, reject);
    }

    function validateRequiredId(params, reject) {
        validateParameter('id', 'The id is required', params, reject);
    }

    function validateParameter(name, msg, params, reject) {
        if (!params[name]) {
            reject(Error(msg));
        }
    }


    //local storage container that will be used to store data in node
    //that is normally stored in the browser session or local storage
    var nodeStorage = {};

    var isNode = typeof module === "object" &&
        typeof exports === "object" &&
        module.exports === exports &&
        typeof global === 'object';

    function useLocalStorage() {
        if (!('Voyent_useLocalStorage' in window)) {
            if ('localStorage' in window) {
                try {
                    var testdate = new Date().toString();
                    window.localStorage.setItem('testdate', testdate);
                    window.Voyent_useLocalStorage = window.localStorage.getItem('testdate') === testdate;
                    window.localStorage.removeItem('testdate');
                } catch (e) {
                    window.Voyent_useLocalStorage = false;
                }
            } else {
                window.Voyent_useLocalStorage = false;
            }

        }
        return window.Voyent_useLocalStorage;
    }

    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }
        return "";
    }

    function setCookie(cname, cvalue, days) {
        var d = new Date();
        d.setTime(d.getTime() + ((days || 1) * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    }
    
    function removeCookie(cname) {
        setCookie(cname, null, -1);
    }

    function getNodeStorageItem(key) {
        return typeof nodeStorage[key] !== 'undefined' ? nodeStorage[key] : null;
    }

    function setNodeStorageItem(key, value) {
        nodeStorage[key] = value;
    }

    function removeNodeStorageItem(key) {
        delete nodeStorage[key];
    }

    function getLocalStorageItem(key) {
        if (!isNode) {
            return useLocalStorage() ? window.localStorage.getItem(key) : v.getCookie(key);
        } else {
            return getNodeStorageItem(key);
        }
    }

    function getSessionStorageItem(key) {
        if (!isNode) {
            return useLocalStorage() ? window.sessionStorage.getItem(key) : getCookie(key);
        } else {
            return getNodeStorageItem(key);
        }
    }

    function setLocalStorageItem(key, value) {
        if (!isNode) {
            return useLocalStorage() ? window.localStorage.setItem(key, value) : setCookie(key, value);
        } else {
            return setNodeStorageItem(key, value);
        }
    }

    function removeSessionStorageItem(key) {
        if (!isNode) {
            if (useLocalStorage()) {
                window.sessionStorage.removeItem(key);
            } else {
                removeCookie(key);
            }
        } else {
            removeNodeStorageItem(key);
        }
    }

    function removeLocalStorageItem(key) {
        if (!isNode) {
            if (useLocalStorage()) {
                window.localStorage.removeItem(key);
            } else {
                removeCookie(key);
            }
        } else {
            removeNodeStorageItem(key);
        }
    }

    function setSessionStorageItem(key, value) {
        if (!isNode) {
            return useLocalStorage() ? window.sessionStorage.setItem(key, value) : setCookie(key, value, 1);
        } else {
            return setNodeStorageItem(key, value);
        }
    }

    function getTransactionURLParam() {
        var txId = services.getLastTransactionId();
        return txId ? 'tx=' + txId : '';
    }

    function getRealmResourceURL(servicePath, account, realm, resourcePath, token, params) {
        var txParam = getTransactionURLParam();
        var url = servicePath +
            '/' + account + '/realms/' + realm + '/' + resourcePath + '?' +
            (token ? 'access_token=' + token : '') +
            (txParam ? '&' + txParam : '');
        if (params) {
            for (var key in params) {
                var param = params[key];
                if (typeof param === 'object') {
                    try {
                        param = JSON.stringify(param);
                    }
                    catch (e) {
                        param = params[key];
                    }
                }
                url += ('&' + key + '=' + param);
            }
        }
        return url;
    }

    function extractResponseValues(xhr) {
        return {
            status: xhr.status,
            statusText: xhr.statusText,
            response: xhr.response,
            responseText: xhr.responseText,
            responseType: xhr.responseType,
            responseXML: xhr.responseXML
        }
    }

    function getFunctionName(fn) {
        var ret = fn.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
    }

    function findFunctionInGlobalScope(fn) {
        if (!fn) {
            return null;
        }
        var functionName;
        if (typeof fn === "string") {
            functionName = fn;
            var parts = functionName.split(".");
            var theObject = window;
            for (var i = 0; i < parts.length; i++) {
                theObject = theObject[parts[i]];
                if (!theObject) {
                    return null;
                }
            }
            if (window == theObject) {
                return null;
            }
            return theObject;
        }
        else if (typeof fn === "function") {
            return fn;
        }
    }

    return {
        'isNode': isNode,
        'getLocalStorageItem': getLocalStorageItem,
        'setLocalStorageItem': setLocalStorageItem,
        'removeLocalStorageItem': removeLocalStorageItem,
        'getSessionStorageItem': getSessionStorageItem,
        'setSessionStorageItem': setSessionStorageItem,
        'removeSessionStorageItem': removeSessionStorageItem,
        'getTransactionURLParam': getTransactionURLParam,
        'getRealmResourceURL': getRealmResourceURL,
        'extractResponseValues': extractResponseValues,
        'getFunctionName': getFunctionName,
        'findFunctionInGlobalScope': findFunctionInGlobalScope,
        'validateParameter': validateParameter,
        'validateRequiredUsername': validateRequiredUsername,
        'validateRequiredPassword': validateRequiredPassword,
        'validateAndReturnRequiredUsername': validateAndReturnRequiredUsername,
        'validateRequiredRealm': validateRequiredRealm,
        'validateAndReturnRequiredRealm': validateAndReturnRequiredRealm,
        'validateAndReturnRequiredRealmName': validateAndReturnRequiredRealmName,
        'validateAndReturnRequiredAccount': validateAndReturnRequiredAccount,
        'validateAndReturnRequiredAccessToken': validateAndReturnRequiredAccessToken,
        'validateRequiredId': validateRequiredId
    }
}function PublicUtils(utils) {
    return {

        serializePostData: function(data){
            //TODO
        },

        get: function(url, headers){
            return new Promise(function(resolve, reject) {
                var request = new XMLHttpRequest();
                request.open('GET', url, true);
                if( headers ){
                    for( var header in headers ){
                        request.setRequestHeader(header, headers[header]);
                    }
                }
                request.onreadystatechange = function() {
                    if (this.readyState === 4) {
                        if (this.status >= 200 && this.status < 400) {
                            resolve(this.responseText);
                        } else {
                            reject(utils.extractResponseValues(this));
                        }
                    }
                };
                request.onabort = function(evt){
                    reject(evt);
                };
                request.onerror = function(err){
                    reject(err);
                };
                request.send();
                request = null;
            });
        },

        getJSON: function(url, headers){
            return new Promise(function(resolve, reject) {
                var request = new XMLHttpRequest();
                request.open('GET', url, true);
                if( headers ){
                    for( var header in headers ){
                        request.setRequestHeader(header, headers[header]);
                    }
                }
                request.onreadystatechange = function() {
                    if (this.readyState === 4) {
                        if (this.status >= 200 && this.status < 400) {
                            if (this.responseText) {
                                resolve(JSON.parse(this.responseText));
                            }
                            else {
                                resolve();
                            }
                        } else {
                            reject(utils.extractResponseValues(this));
                        }
                    }
                };
                request.onabort = function(evt){
                    reject(evt);
                };
                request.onerror = function(err){
                    reject(err);
                };
                request.send();
                request = null;
            });
        },

        getBlob: function(url, headers){
            return new Promise(function(resolve, reject){
                var request = new XMLHttpRequest();
                if( headers ){
                    for( var header in headers ){
                        request.setRequestHeader(header, headers[header]);
                    }
                }
                request.onreadystatechange = function(){
                    if (this.readyState === 4){
                        if( this.status === 200){
                            resolve(new Uint8Array(this.response));
                        }
                        else{
                            reject(this);
                        }
                    }
                };
                request.onabort = function(evt){
                    reject(evt);
                };
                request.onerror = function(err){
                    reject(err);
                };
                request.open('GET', url);
                request.responseType = 'arraybuffer';
                request.send();
                request = null;
            });
        },

        post: function(url, data, headers, isFormData, contentType, progressCallback, onabort, onerror){
            return new Promise(function(resolve, reject) {
                console.log('sending post to ' + url);
                contentType = contentType || "application/json";
                var request = new XMLHttpRequest();
                request.open('POST', url, true);
                if( !isFormData ){
                    request.setRequestHeader("Content-type", contentType);
                }
                if( headers ){
                    for( var header in headers ){
                        request.setRequestHeader(header, headers[header]);
                    }
                }
                if( progressCallback ){
                    request.upload.addEventListener("progress", function(evt){
                        window.voyent.auth.updateLastActiveTimestamp();
                        if (evt.lengthComputable){
                            var percentComplete = evt.loaded / evt.total;
                            progressCallback(percentComplete, request);
                        }
                    }, false);
                }
                request.onabort = function(evt){
                    if( onabort ){
                        onabort();
                    }
                    reject(evt);
                };
                request.onerror = function(err){
                    if( onerror ){
                        request.onerror = onerror;
                    }
                    reject(err);
                };

                request.onreadystatechange = function() {
                    if (this.readyState === 4) {
                        if (this.status >= 200 && this.status < 400) {
                            if( this.responseText ){
                                var json = null;
                                try{
                                    json = JSON.parse(this.responseText);
                                    resolve(json);
                                }
                                catch(e){
                                    resolve(utils.extractResponseValues(this));
                                }
                            }
                            else{
                                resolve(url);
                            }
                        } else {
                            reject(utils.extractResponseValues(this));
                        }
                    }
                };
                if( data ){
                    request.send(isFormData ? data : JSON.stringify(data));
                }
                else{
                    request.send();
                }
            });
        },

        put: function(url, data, headers, isFormData, contentType){
            return new Promise(function(resolve, reject) {
                console.log('sending put to ' + url);
                contentType = contentType || "application/json";
                var request = new XMLHttpRequest();
                request.open('PUT', url, true);
                request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                if( !isFormData ){
                    request.setRequestHeader("Content-type", contentType);
                }
                if( headers ){
                    for( var header in headers ){
                        request.setRequestHeader(header, headers[header]);
                    }
                }
                //request.setRequestHeader("Connection", "close");
                request.onreadystatechange = function() {
                    if (this.readyState === 4) {
                        if (this.status >= 200 && this.status < 400) {
                            if( this.responseText ){
                                var json = null;
                                try{
                                    json = JSON.parse(this.responseText);
                                    resolve(json);
                                }
                                catch(e){
                                    resolve(utils.extractResponseValues(this));
                                }
                            }
                            else{
                                resolve();
                            }
                        } else {
                            reject(utils.extractResponseValues(this));
                        }
                    }
                };
                request.onabort = function(evt){
                    reject(evt);
                };
                request.onerror = function(err){
                    reject(err);
                };
                if( data ){
                    request.send(isFormData ? data : JSON.stringify(data));
                }
                else{
                    request.send();
                }

                request = null;
            });
        },

        doDelete: function(url, headers){
            return new Promise(function(resolve, reject) {
                console.log('sending delete to ' + url);
                var request = new XMLHttpRequest();
                request.open('DELETE', url, true);
                if( headers ){
                    for( var header in headers ){
                        request.setRequestHeader(header, headers[header]);
                    }
                }
                request.onreadystatechange = function() {
                    if (this.readyState === 4) {
                        if (this.status >= 200 && this.status < 400) {
                            window.voyent.auth.updateLastActiveTimestamp();
                            resolve();
                        } else {
                            reject(utils.extractResponseValues(this));
                        }
                    }
                };
                request.onabort = function(evt){
                    reject(evt);
                };
                request.onerror = function(err){
                    reject(err);
                };
                request.send();
                request = null;
            });
        },

        newUUID: function()  {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        },

        isIOS: function(){
            var iDevice = ['iPad', 'iPhone', 'iPod'];
            for (var i = 0; i < iDevice.length ; i++ ) {
                if (navigator.userAgent.indexOf(iDevice[i]) > -1) {
                    return true;
                }
            }

            return false;
        },

        isAndroid: function(){
            return navigator.userAgent.toLowerCase().indexOf("android") > -1;
        }
    };
}if (!window.voyent) {
    window.voyent = {};
}

(function (v) {
    var keys = {
        TRANSACTION_KEY: 'voyentTransaction',
        REALM_KEY: 'voyentRealm',
        ADMIN_KEY: 'voyentAdmin',
        USERNAME_KEY: 'voyentUsername',
        ACCOUNT_KEY: 'voyentAccount',
        HOST_KEY: 'voyentHost',
        TOKEN_KEY: 'voyentToken',
        TOKEN_EXPIRES_KEY: 'voyentTokenExpires',
        TOKEN_SET_KEY: 'voyentTokenSet'
    };
    
    var privateUtils = PrivateUtils(v, keys);
    v.$ = PublicUtils(privateUtils);

    //publish some of the private utility functions
    //todo: move the functions into the public-utils.js file if indeed needed
    v.$.getLocalStorageItem = privateUtils.getLocalStorageItem;
    v.$.setLocalStorageItem = privateUtils.setLocalStorageItem;
    v.$.removeLocalStorageItem = privateUtils.removeLocalStorageItem;
    v.$.getSessionStorageItem = privateUtils.getSessionStorageItem;
    v.$.setSessionStorageItem = privateUtils.setSessionStorageItem;
    v.$.removeSessionStorageItem = privateUtils.removeSessionStorageItem;

    v.configureHosts = function (url) {
        if (!url) {
            if (privateUtils.isNode) {
                v.baseURL = 'http://dev.voyent.cloud';
            } else {
                v.baseURL = window.location.protocol + '//' + window.location.hostname;
                if (window.location.port) {
                    v.baseURL += ':' + window.location.port
                }
            }
        } else {
            v.baseURL = url;
        }
        //remove any trailing '/'
        if (v.baseURL.substr(v.baseURL.length - 1) === '/') {
            v.baseURL = v.baseURL.slice(0,-1);
        }
        var baseURL = v.baseURL;
        v.authURL = baseURL + '/auth';
        v.authAdminURL = baseURL + '/authadmin';
        v.locateURL = baseURL + '/locate';
        v.docsURL = baseURL + '/docs';
        v.storageURL = baseURL + '/storage';
        v.eventURL = baseURL + '/event';
        v.queryURL = baseURL + '/query';
        v.actionURL = baseURL + '/action';
        v.eventhubURL = baseURL + '/eventhub';
        v.mailboxURL = baseURL + '/mailbox';
        v.deviceURL = baseURL + '/device';
        v.scopeURL = baseURL + '/scope';
        v.pushURL = baseURL + '/notify';
        v.cloudURL = baseURL + '/cloud';
    };

    /**
     * Start a Voyent transaction.
     *
     * This function will create a new transaction id, and automatially append the id to all voyent network calls.
     * A Voyent transaction is not a ACID transaction, but simply a useful method to aid in auditing and diagnosing
     * distributed network calls, especially among different services.
     *
     * @example
     *    voyent.startTransaction();
     *   console.log('started transaction: ' +  voyent.getLastTransactionId());
     *
     *    voyent.auth.login({
     *       account: accountId,
     *       username: adminId,
     *       password: adminPassword,
     *       host: host
     *   }).then(function (authResponse) {
     *       return  voyent.docs.createDocument({
     *           document: newDoc,
     *           realm: realmId
     *       });
     *   }).then(function (docURI) {
     *       newDocURI = docURI;
     *       var uriParts = docURI.split('/');
     *       var docId = uriParts[uriParts.length - 1];
     *       return  voyent.docs.deleteDocument({
     *           account: accountId,
     *           realm: realmId,
     *           host: host,
     *           id: docId
     *       })
     *   }).then(function () {
     *       console.log('completed transaction: ' +  voyent.getLastTransactionId());
     *        voyent.endTransaction();
     *   }).catch(function (error) {
     *       console.log('something went wrong with transaction: ' +  voyent.getLastTransactionId());
     *        voyent.endTransaction();
     *   });
     */
    v.startTransaction = function () {
        privateUtils.setSessionStorageItem(btoa(keys.TRANSACTION_KEY), v.$.newUUID());
        console.log('bridgeit: started transaction ' + v.getLastTransactionId());
    };

    /**
     * End a Voyent transaction.
     *
     * This function will remove the current Voyent transaction id, if one exists.
     */
    v.endTransaction = function () {
        privateUtils.removeSessionStorageItem(btoa(keys.TRANSACTION_KEY));
        console.log('bridgeit: ended transaction ' + v.getLastTransactionId());
    };

    /**
     * Get last transaction.
     *
     * Return the last stored Voyent transaction id.
     */
    v.getLastTransactionId = function () {
        return privateUtils.getSessionStorageItem(btoa(keys.TRANSACTION_KEY));
    };

    /**
     * Sets the current realm for all subsequent operations. This is useful when logging in as an admin, who is not
     * in any realm, but needing to ensure that all other operations are done with a particular realm.
     *
     * @example
     *     voyent.auth.login({
     *      account: accountId,
     *    	username: adminId,
     *    	password: adminPassword,
     *    	host: host
     *    }).then(function(authResponse){
     *    	 voyent.setCurrentRealm('myRealm');
     *    	//realm is no longer required for all subsequent operations
     *    	return  voyent.docs.createDocument({
     *    		document: newDoc
     *    	});
     *    }).then(function(docURI){
     *    	newDocURI = docURI;
     *    	var uriParts = docURI.split('/');
     *    	var docId = uriParts[uriParts.length-1];
     *    	return  voyent.docs.deleteDocument({
     *    		account: accountId,
     *    		host: host,
     *    		id: docId
     *    	})
     *    });
     *
     *
     * @alias setCurrentRealm
     * @global
     * @param {String} realm The name of thre realm to use for future operations.
     */
    v.setCurrentRealm = function(realm){
        privateUtils.setSessionStorageItem(btoa(keys.REALM_KEY), btoa(realm));
    };

    /**
     * Return the permissions block for a resource. A permissions block has the following structure:
     *
     * @example
     *    {
     *        "_id": "de6959d0-a885-425c-847a-3289d07321ae",
     *        "owner": "jo.smith",
     *        "rights": {
     *            "owner": ["r","u","d","x","pr","pu"],
     *            "realm": ["r","x"],
     *            "roles": {
     *                "demoAdmin": ["r","u","d","x","pu"]
     *            }
     *        }
     *    }
     *
     *
     * The permissions codes:
     *
     *     r: Read
     *     u: Update
     *     d: Delete
     *     x: Execute
     *    pr: Permissions Read
     *    pu: Permissions Update
     *    mu: Client Metadata Update
     *
     *
     * @example
     *     voyent.getResourcePermissions({
     *    	account: accountId,
     *    	username: adminId,
     *    	password: adminPassword,
     *    	host: host,
     *    	service: 'docs',
     *    	path: 'documents',
     *    	id: 'resourceId'
     *    }).then(function(permissions){
     *    	console.log('permissions', permissions);
     *    });
     *
     * @alias getResourcePermissions
     * @global
     *
     * @param {Object} params params
     * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
     *     will be used.
     * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
     *     will be used.
     * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
     *      voyent.auth.connect() will be used
     * @param {String} params.id The id of the resource to get permissions for.
     * @param {String} params.service The service that manages the resource.
     * @param {String} params.path The path to the resource.
     * @returns {Object} The permissions block for the resource.
     */
    v.getResourcePermissions = function(params){
        return new Promise(
            function(resolve, reject) {
                params = params ? params : {};

                //validate
                var account = privateUtils.validateAndReturnRequiredAccount(params, reject);
                var realm = privateUtils.validateAndReturnRequiredRealm(params, reject);
                var token = privateUtils.validateAndReturnRequiredAccessToken(params, reject);
                privateUtils.validateRequiredId(params, reject);
                privateUtils.validateParameter('service', 'The service parameter is required', params, reject);
                privateUtils.validateParameter('path', 'The path parameter is required', params, reject);

                var serviceURL;
                switch(params.service){
                    case 'docs': serviceURL = v.docsURL; break;
                    case 'action': serviceURL = v.actionURL; break;
                    case 'eventhub': serviceURL = v.eventhubURL; break;
                    case 'query': serviceURL = v.queryURL; break;
                    case 'storage': serviceURL = v.storageURL; break;
                    case 'mailbox': serviceURL = v.mailboxURL; break;
                    case 'locate': serviceURL = v.locateURL; break;
                }

                var url = privateUtils.getRealmResourceURL(serviceURL, account, realm, params.path + '/' + params.id + '/permissions', token);

                v.$.getJSON(url).then(function(json){
                    v.auth.updateLastActiveTimestamp();
                    var permissionsBlock;
                    if( json.directory && json.directory.length > 0 ){
                        permissionsBlock = json.directory[0];
                    }
                    else{
                        permissionsBlock = json;
                    }
                    resolve(permissionsBlock);
                })['catch'](function(error){
                    reject(error);
                });
            }
        );
    };

    /**
     * Modify the permissions block for a resource. See {@link getResourcePermissions} for additional details.
     *
     * @example
     *    var permissionsBlock == {
     *        "_id": "de6959d0-a885-425c-847a-3289d07321ae",
     *        "owner": "jo.smith",
     *        "rights": {
     *            "owner": ["r","u","d","x","pr","pu"],
     *            "realm": ["r","x"],
     *            "roles": {
     *                "demoAdmin": ["r","u","d","x","pu"]
     *            }
     *        }
     *    };
     *
     * @example
     *     voyent.updateResourcePermissions({
     *    	account: accountId,
     *    	username: adminId,
     *    	password: adminPassword,
     *    	host: host,
     *    	service: 'docs',
     *    	path: 'documents',
     *    	id: 'resourceId',
     *    	permissions: permissionsBlock
     *    }).then(function(permissions){
     *    	console.log('permissions', permissions);
     *    });
     *
     *
     * @alias updateResourcePermissions
     * @global
     *
     * @param {Object} params params
     * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
     *     will be used.
     * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
     *     will be used.
     * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
     *      voyent.auth.connect() will be used
     * @param {String} params.id The id of the resource to get permissions for.
     * @param {String} params.service The service that manages the resource.
     * @param {String} params.path The path to the resource.
     * @returns {Object} The permissions block for the resource.
     */
    v.updateResourcePermissions = function(params){
        return new Promise(
            function(resolve, reject) {
                params = params ? params : {};

                //validate
                var account = privateUtils.validateAndReturnRequiredAccount(params, reject);
                var realm = privateUtils.validateAndReturnRequiredRealm(params, reject);
                var token = privateUtils.validateAndReturnRequiredAccessToken(params, reject);
                privateUtils.validateRequiredId(params, reject);
                privateUtils.validateParameter('permissions', 'The permissions parameter is required', params, reject);
                privateUtils.validateParameter('service', 'The service parameter is required', params, reject);
                privateUtils.validateParameter('path', 'The path parameter is required', params, reject);

                var serviceURL;
                switch(params.service){
                    case 'docs': serviceURL = v.io.docsURL; break;
                    case 'action': serviceURL = v.io.actionURL; break;
                }

                var url = privateUtils.getRealmResourceURL(serviceURL, account, realm, params.path + '/' + params.id + '/permissions', token);

                v.$.put(url, params.permissions).then(function(json){
                    v.auth.updateLastActiveTimestamp();
                    resolve(json);
                })['catch'](function(error){
                    reject(error);
                });
            }
        );
    };

    v.action = ActionService(v, privateUtils);
    v.admin = AdminService(v, keys, privateUtils);
    v.auth = AuthService(v, keys, privateUtils);
    v.docs = DocService(v, privateUtils);
    v.eventhub = EventHubService(v, privateUtils);
    v.locate = LocateService(v, privateUtils);
    v.mailbox = MailboxService(v, privateUtils);
    v.scope = ScopeService(v, privateUtils);
    v.metrics = MetricsService(v, privateUtils);
    v.event = EventService(v, privateUtils);
    v.push = PushService(v, privateUtils);
    v.cloud = CloudService(v, privateUtils);
    v.storage = StorageService(v, privateUtils);
    v.query = QueryService(v, privateUtils);
    v.device = DeviceService(v, privateUtils);

    //aliases for backward compatibility
    v.documents = v.docs;
    v.location = v.locate;

    /* Initialization */
    v.configureHosts();

})(voyent);
