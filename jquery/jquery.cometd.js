/*
 * Copyright (c) 2008-2014 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
( function () {
    function bind( m, org_cometd ) {
        // Remap cometd JSON functions to jquery JSON functions
        org_cometd.JSON.toJSON = JSON.stringify;
        org_cometd.JSON.fromJSON = JSON.parse;

        function _setHeaders( xhr, headers ) {
            if ( headers ) {
                for ( var headerName in headers ) {
                    if ( headerName.toLowerCase() === 'content-type' ) {
                        continue;
                    }
                    xhr.setRequestHeader( headerName, headers[ headerName ] );
                }
            }
        }

        // Remap toolkit-specific transport calls
        function LongPollingTransport() {
            var _super = new org_cometd.LongPollingTransport();
            var that = org_cometd.Transport.derive( _super );

            that.xhrSend = function ( packet ) {
                return m.request( {
                    url: packet.url,
                    method: 'POST',
                    data: packet.body,
                    config: function ( xhr ) {
                        xhr.withCredentials = true;
                        _setHeaders( xhr, packet.headers );
                        return true;
                    }
                } ).then( packet.onSuccess, packet.onError );
            };

            return that;
        }

        function CallbackPollingTransport() {
            var _super = new org_cometd.CallbackPollingTransport();
            var that = org_cometd.Transport.derive( _super );

            that.jsonpSend = function ( packet ) {
                m.request( {
                    url: packet.url,
                    method: 'GET',
                    dataType: 'jsonp',
                    data: {
                        message: packet.body
                    },
                    callbackKey: 'jsonp',
                    config: function ( xhr ) {
                        _setHeaders( xhr, packet.headers );
                        return true;
                    }
                } ).then( packet.onSuccess, packet.onError );
            };

            return that;
        }

        var Cometd = function ( name ) {
            var cometd = new org_cometd.CometD( name );

            // Registration order is important
            if ( org_cometd.WebSocket ) {
                cometd.registerTransport( 'websocket', new org_cometd.WebSocketTransport() );
            }
            cometd.registerTransport( 'long-polling', new LongPollingTransport() );
            cometd.registerTransport( 'callback-polling', new CallbackPollingTransport() );

            return cometd;
        };

        return Cometd;
    }

    if ( typeof define === 'function' && define.amd ) {
        define( [ 'mithril', 'org/cometd' ], bind );
    }
    if ( typeof module != 'undefined' ) {
        module.exports = bind( require( 'mithril' ), require( '../org/cometd.js' ) );
    } else {
        bind( window.m, window.org.cometd );
    }
} )();
