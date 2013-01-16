//Prototype
if (!google.maps.Polyline.prototype.getPointAtDistance) {
    google.maps.Polyline.prototype.getPointAtDistance = function(_Distance) {
        var dist = 0, distAnterior = 0;

        if (this.getPath().getLength() == 0)
            return null;

        if (_Distance == 0)
            return this.getPath().getAt(0);

        for (var i = 1; i < this.getPath().getLength() && dist < _Distance; i++) {
            distAnterior = dist;
            dist += google.maps.geometry.spherical.computeDistanceBetween(this.getPath().getAt(i), this.getPath().getAt(i - 1));
        }
        
        if (dist >= _Distance) // passou da distância, estima o ponto intermediário
        {
            var p1 = this.getPath().getAt(i - 2);
            var p2 = this.getPath().getAt(i - 1);
            var m = (_Distance - distAnterior) / (dist - distAnterior);
            return new google.maps.LatLng(p1.lat() + (p2.lat() - p1.lat()) * m, p1.lng() + (p2.lng() - p1.lng()) * m);
        }
        
        return null;
    }
}

(function( $ ){
    var methods = {
        
        /**
         * Função inicial do sistema
         * @param Div HTML Element
         */ 
        initMap: function (Div){
            if(!Div) {
                console.error('Nenhuma div encontrada');
                return false;
            }
            
            Gmaps = {
        
                /**
                 * Armazena o objeto Google Map
                 * google.maps.Map
                 * https://developers.google.com/maps/documentation/javascript/reference?hl=#Map
                 */
                Map: null,
        
                /**
                 *Array para armazenar objetos google.maps.InfoWindow
                 * https://developers.google.com/maps/documentation/javascript/reference#InfoWindow
                 */
                InfoWindows: new Array(),
        
                /**
                 * Array para armazenar objetos google.maps.Marker
                 * https://developers.google.com/maps/documentation/javascript/reference#Marker
                 */
                Markers: new Array(),
        
                /**
                 * Armazena um objeto google.maps.Polyline
                 * https://developers.google.com/maps/documentation/javascript/reference#Polyline
                 */
                Rota: new google.maps.Polyline(),
                
                /**
                 * Distancia da rota
                 */
                Distance: 0
            }
            
            //Inicia o map
            Gmaps.Map = new google.maps.Map(Div, options['MapOptions']);
            return Gmaps;
        },
        
        /**
         * Valida o objeto Gmap
         * @param Gmap object
         */
        ValideteGmap: function (Gmap) {
            //Verifica se existe algum mapa para ser alterado
            if(!Gmap) { 
                if($.Gmap) {
                    Gmap = $.Gmap;
                } else{
                    throw 'Não há nenhnum mapa para carregar a polyline!';
                }
            }
            
            return Gmap;
        },
        
        /**
         * Carrega uma rota apartir de uma url codificada do google
         * https://developers.google.com/maps/documentation/javascript/geometry?hl=pt-br
         * @param UrlEncoded string
         * @param Gmap object
         * @param PolylineOptions object
         */ 
        LoadPolylineByUrlEncoded: function (UrlEncoded,Gmap,PolylineOptions) {
            try {
                if(!UrlEncoded) throw '@param UrlEncoded está não foi informada';
                if(typeof UrlEncoded != 'string') throw '@param UrlEncoded não é uma string';
                    
                if(!PolylineOptions) {
                    PolylineOptions = options['PolylineOptions'];
                }
                
                //Valida o objeto
                Gmap = methods['ValideteGmap'].apply(this,new Array(Gmap));
                
                //Seta as opções da Polyline de rota
                Gmap.Rota.setOptions(PolylineOptions);
            
                //Seta o mapa da Polyline de rota
                Gmap.Rota.setMap(Gmap.Map);
                
                //Passa um MVCArray para o Polyline da rota
                Gmap.Rota.setPath(consts['Geometry'].encoding.decodePath(UrlEncoded));
                
                //Calcula a distancia da rota
                Gmap.Distance = consts['Geometry'].spherical.computeLength(Gmap.Rota.getPath());
                
                //Centraliza o mapa
                methods['CenterMapByPath'].apply(this,new Array(Gmap));
                
                //Verifica se é para colocar o marcador de inicio
                if(options['MarkerBeginKey'] !== false && typeof options['MarkerBeginKey'] == 'string') {
                    Gmap = methods['AddMarkerBegin'].apply(this,new Array(Gmap));
                }
                
                //Verifica se é para colocar o marcador de fim
                if(options['MarkerEndKey'] !== false && typeof options['MarkerEndKey'] == 'string') {
                    Gmap = methods['AddMarkerEnd'].apply(this,new Array(Gmap));
                }
                
                //Verifica se existe algum intervalo de marcadores definidos
                if(typeof options['DistanceMarkerInterval'] == 'number' && options['DistanceMarkerInterval'] > 0) {
                    Gmap = methods['AddDistanceMarkers'].apply(this,new Array(Gmap,options['DistanceMarkerInterval'],options['TypeDistanceMarkerIcon']));
                }
                
                return Gmap;
            } catch(err) {
                console.error('Erro: '+err);
            }
        },
        
        /**
         * Adiciona Mardadores por distanci
         * @param Gmap object
         * @param DistanceMarkerInterval int
         * @param TypeDistanceMarkerIcon bool
         */ 
        AddDistanceMarkers: function (Gmap,DistanceMarkerInterval,TypeDistanceMarkerIcon) {
            try {
                //Valida o objeto Gmap
                Gmap = methods['ValideteGmap'].apply(this,new Array(Gmap));
                
                //Quantia de marcadores a serem adicionados
                distanceMarkers = Math.floor(Gmap.Distance / DistanceMarkerInterval);
                
                //Array de marcadores
                markers = new Array();
                
                while(distanceMarkers > 0) {
                    //LatLng do marcador da posição atual
                    latLng = Gmap.Rota.getPointAtDistance(DistanceMarkerInterval * distanceMarkers)
                    
                    //Verifica se é para ser colocada uma imagem diferente
                    // no marcador de distancia
                    icon = null;
                    if(TypeDistanceMarkerIcon) {
                        if(typeof TypeDistanceMarkerIcon == 'string') {
                            icon = distanceMarkers+'.'+TypeDistanceMarkerIcon;
                        }
                    }
                    
                    markers.push({
                        lat: latLng.lat(),
                        lng: latLng.lng(),
                        icon: icon
                    });
                    distanceMarkers--;
                }
                
                Gmap = methods['AddMarkers'].apply(this,new Array(markers, Gmap));
            } catch (err) {
                console.error('Erro: '+err.message);
            }
        },
        
        /**
         * Adiciona marcador de inicio
         * @param Gmap object
         * @param MarkerOptions object
         */
        AddMarkerBegin: function (Gmap,MarkerOptions) {
            try {
                //Verifica se existe um indice para o marcador de inicio
                if(!options['MarkerBeginKey'] || typeof options['MarkerBeginKey'] != 'string')
                    throw "options['MarkerBeginKey'] não é valido";
                
                //Valida o objeto Gmap
                Gmap = methods['ValideteGmap'].apply(this,new Array(Gmap));
                
                //Pega o objeto path
                path = Gmap.Rota.getPath();
                
                //Pega o objeto LatLng da primeira posição da rota
                latLng = path.getAt(0);
                
                //Objeto Marker
                Marker = {
                    lat: latLng.lat(),
                    lng: latLng.lng(),
                    key: options['MarkerBeginKey'],
                    icon: options['MarkerBeginImage']
                }
                
                //Adiciona o marcador
                Gmap = methods['AddMarkers'].apply(this,new Array(Marker, Gmap, MarkerOptions));
                
                return Gmap;
                
            } catch (err) {
                console.error('Erro: '+err.message);
            }
        },
        
        /**
         * Adiciona marcador de inicio
         * @param Gmap object
         * @param MarkerOptions object
         */
        AddMarkerEnd: function (Gmap,MarkerOptions) {
            try {
                //Verifica se existe um indice para o marcador de inicio
                if(!options['MarkerEndKey'] || typeof options['MarkerEndKey'] != 'string')
                    throw "options['MarkerEndKey'] não é valido";
                
                //Valida o objeto Gmap
                Gmap = methods['ValideteGmap'].apply(this,new Array(Gmap));
                
                //Pega o objeto path
                path = Gmap.Rota.getPath();
                
                //Pega o objeto LatLng da primeira posição da rota
                latLng = path.getAt(path.length - 1);
                
                //Objeto Marker
                Marker = {
                    lat: latLng.lat(),
                    lng: latLng.lng(),
                    key: options['MarkerEndKey'],
                    icon: options['MarkerEndImage']
                }
                
                //Adiciona o marcador
                Gmap = methods['AddMarkers'].apply(this,new Array(Marker, Gmap, MarkerOptions));
                
                return Gmap;
                
            } catch (err) {
                console.error('Erro: '+err.message);
            }
        },
        
        /**
         * Adiciona marcadores por distância
         * @param Gmap
         */ 
        
        /**
         * Centraliza o mapa baseado na rota atual
         * @param Gmap
         */ 
        CenterMapByPath: function (Gmap) {
            try {
                //Valida o objeto Gmap
                Gmap = methods['ValideteGmap'].apply(this,new Array(Gmap));
                
                //Pega o objeto path
                path = Gmap.Rota.getPath();
                
                //Instancia um objeto LatLngBounds
                //https://developers.google.com/maps/documentation/javascript/reference?hl=pt-br#LatLngBounds
                bounds = new google.maps.LatLngBounds();
                
                path.forEach(function (e) {
                    bounds.extend(e);
                });

                Gmap.Map.fitBounds(bounds);
                
                return Gmap;
            } catch(err) {
                console.error('Erro: '+err.message);
            }
        },
        
        /**
         * Carrega marcadores
         * @param Markers array
         * @param Gmap object
         * @param MarkerOptions object
         */ 
        AddMarkers:function (Markers, Gmap, MarkerOptions) {
            try {
                
                if(typeof Markers != 'object') throw "@param markers deve ser do tipo array ou object";
                Gmap = methods['ValideteGmap'].apply(this,new Array(Gmap));
                
                if(!MarkerOptions)
                    MarkerOptions = options['MarkerOptions'];
                
                //Define o map em que os marcadores deverão ser colocados
                MarkerOptions.map = Gmap.Map;
                
                $(Markers).each(function (i,e) {
                    
                    //Define a posição do marcador
                    MarkerOptions.position = new google.maps.LatLng(e.lat,e.lng);
                    
                    //Define o icone do marcador
                    icon = null;
                    if(e.icon) {
                        
                        //Verifica se há uma pasta padrão para icones
                        if(typeof options['PathForIcons'] == 'string'){
                            icon = options['PathForIcons']+'/'+e.icon;
                        } else {
                            icon = e.icon;
                        }
                    }
                    MarkerOptions.icon = icon;
                    
                    //Indice do novo marcador.
                    k = Gmaps.Markers.length;
                    
                    //Verifica se existe um indice padrão do marcador
                    if(e.key) {
                        Gmap.Markers[e.key] = new google.maps.Marker(MarkerOptions);
                        k = e.key;
                    } else {
                        Gmap.Markers.push(new google.maps.Marker(MarkerOptions));
                    }
                    
                    //Verifica se existe algum texto para relacionar ao marcador
                    if(e.text) {
                        //Adiciona uma InfoWindow ao marcador
                        Gmap = methods['NewInfoWindow'].apply(this,new Array(e.text,Gmap,Gmap.Markers[k]));
                    }
                });
                
                return Gmap;
            } catch (err) {
                console.error('Erro: '+err.message);
            }
        },
        
        /**
         * Adiciona uma InfoWindow
         * https://developers.google.com/maps/documentation/javascript/reference?hl=pt-br#InfoWindow
         * @param Content
         * @param Gmap object
         * @param Anchor object
         * @param InfoWindowOptions
         * @param Open
         * @param Event
         */
        NewInfoWindow: function (Content,Gmap,Anchor,InfoWindowOptions,Open,Event) {
            try {
                
                //Valida os parametros de entrada
                if(typeof Gmap != 'object') throw "@param Gmap não foi passado corretamente";
                
                if(Anchor)
                    if(typeof Anchor != 'object') throw "@param Anchor não foi passado corretamente";
                
                if(!Content) throw "@param Content não foi enviado";
                
                if(!Event) Event = 'click';
                
                //Opções de infoWindows
                if(!InfoWindowOptions) {
                    InfoWindowOptions = options['InfoWindowOptions'];
                } else {
                    InfoWindowOptions = $.extend(options['InfoWindowOptions'],InfoWindowOptions);
                }
                
                InfoWindowOptions.content = Content;
                
                k = Gmap.InfoWindows.length;
                
                Gmap.InfoWindows.push(new google.maps.InfoWindow(InfoWindowOptions));
                
                if(Anchor) {
                    if(Open) {
                        Gmap.InfoWindows[k].open(Gmap.Map,Anchor);
                    }
                    
                    consts['Event'].addListener(Anchor,Event,function () {
                        Gmap.InfoWindows[k].open(Gmap.Map,Anchor);
                    })
                }
                
                return Gmap;
            } catch (err) {
                console.error('Erro: '+err.message);
            }
        }
    }
    
    var options = {
        
        /**
         * Opçoes do Objeto mapa 
         * https://developers.google.com/maps/documentation/javascript/reference?hl=#MapOptions
         */
        MapOptions: {
            zoom: 8,
            mapTypeOptions: {
                mapTypeIds: [
                google.maps.MapTypeId.ROADMAP,
                google.maps.MapTypeId.SATELLI,
                google.maps.MapTypeId.TERRAIN,
                google.maps.MapTypeId.HYBRID
                ]
            },
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            center: new google.maps.LatLng(-14.235004,-51.92527999999999)
        },
        
        /**
         * Opçoes do Objeto Rota(Polyline)
         * https://developers.google.com/maps/documentation/javascript/reference?hl=#PolylineOptions
         */ 
        PolylineOptions: {
            strokeColor: "#4C4CFF",
            strokeOpacity: 0.6, 
            strokeWeight: 5,
            clickable: true
        },
        
        /**
         * Opções do Objeto de Marcador
         * https://developers.google.com/maps/documentatin/javascript/reference?hl=pt-br#MarkerOptions
         */
        MarkerOptions: {},
        
        /**
         *Opções de InfoWindows
         *https://developers.google.com/maps/documentation/javascript/reference?hl=pt-br#InfoWindowOptions
         */
        InfoWindowOptions: {},
        
        /**
         * Caminho padrão dos icones de marcadores
         */
        PathForIcons: null,
                
        /**
         * Indice do marcador de inicio
         * Se for FALSE, quer dizer que a opção é invalida
         */
        MarkerBeginKey: 'begin',
        
        /**
         * Imagem do marcador de inicio
         */
        MarkerBeginImage: 'inicio.gif',
        
        /**
         * Indice do marcador de fim
         * Se for FALSE, quer dizer que a opção é invalida
         */
        MarkerEndKey: 'begin',
        
        /**
         * Imagem do marcador de Fim
         */
        MarkerEndImage: 'fim.gif',
        
        /**
         * Coloca marcadores no intervalo de distancia dessa variavel
         * Se for 0 ou false, não acrecenta marcadores de distancias
         */
        DistanceMarkerInterval:0,
        
        /**
         * prefixo da imagem do marcador de distancia
         */
        TypeDistanceMarkerIcon: false
        
    }
    
    /**
     * Constantes gerais
     */ 
    var consts ={
        /**
         * Instancia do objeto Google Geocoder
         * https://developers.google.com/maps/documentation/javascript/reference?hl=#Geocoder
         */
        Geocoder: new google.maps.Geocoder(),
        
        /**
         * Instancia do objeto Google Events
         * https://developers.google.com/maps/documentation/javascript/reference?hl=#event
         */
        Event: google.maps.event,
        
        /**
         * Instancia do objeto Google Geometry
         * https://developers.google.com/maps/documentation/javascript/reference?hl=pt-br#encoding
         * https://developers.google.com/maps/documentation/javascript/reference?hl=pt-br#spherical
         * https://developers.google.com/maps/documentation/javascript/reference?hl=pt-br#poly
         */ 
        Geometry: google.maps.geometry
    }
    
    /**
     * Objeto Gmaps padrão
     */ 
    $.Gmap = null;
    
    /**
     * Função inicial do plugin Gmaps
     * @param option object,array,string
     */
    $.fn.Gmaps = function(option) {
        //Trata @param option
        switch(typeof option) {
            case 'object':
                //Verifica se @param option é um array. Se ele for, assume cada elemento
                //do array como uma opção de @var options
                for(i in option) {
                    if(typeof i != 'string') {
                        console.error('Ocorreu um erro com o tipo de indice do array passado');
                        return;
                    }
                    
                    if(typeof option[i] == 'object') {
                        //Altera o valor padrão da @var options[i]
                        options[i] = $.extend(options[i],option[i]);
                    } else {
                        options[i] = option[i];
                    }
                }
                break;
                
            case 'string':
                args = Array.prototype.slice.call( arguments, 1);
                if(methods[option]) {
                    //Retorna o método
                    return methods[option].apply( this, args);                    
                } else if(options[option]) {
                    args = args[0];
                    
                    if(typeof options == typeof args) {
                
                        if(typeof options[option] == 'object') {
                            options[option] = $.extend(options[option], args);
                        } else {
                            options[option] = args;
                        }
                    }
                }
                break;
                
        }
        var Len = this.length;
        var Return = new Array();
        
        /**
         * Função que percorre todos os elementos atigindos pelo seletor jquery.
         * @param i Indice do elemento HTML selecionado
         * @param e Elemento HTML selecionado
         */
        this.each(function(i,e) {
            if(Len > 1) {
                Return.push(methods['initMap'].apply(this, new Array(e)));
            } else {
                Return = $.Gmap = methods['initMap'].apply(this, new Array(e));
            }
        });
        
        return Return;        
    }
    
})( jQuery );