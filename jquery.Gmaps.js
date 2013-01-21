//Carrega o pacote de visualization do google
google.load("visualization", "1", {
    packages: ["columnchart"]
});
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
         * Cria um novo objeto Gmap relacionado a uma div
         * @param Div HTML Element
         */ 
        NewGmap: function (Div){
            if(!Div) {
                console.error('Nenhuma div encontrada');
                return false;
            }
            
            Gmap = {
        
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
            Gmap.Map = new google.maps.Map(Div, options['MapOptions']);
            return Gmap;
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
         * Inicia um grávico de elevação
         * @param Gmap object
         */ 
        NewElevationChart: function (Gmap) {
            try {
                //Valida o objeto
                Gmap = methods['ValideteGmap'].apply(this,new Array(Gmap));
                
                //Adiciona um id ao elemento passado(caso o mesmo não tenha id)
                if(!$(this).attr('id')) {
                    
                    //Executa um bloco de instruções para gerar um id sem conflito
                    do {
                        //Gera um novo id
                        id = $(this).attr('class')+Math.floor(Math.random()*100);
                        
                        //Atribui o id ao elemento
                        $(this).attr('id',id);
                    } while ($('#'+id).length > 1)
                    
                } else {
                    id = $(this).attr('id');
                }
                
                //Pega o elemento html para ser gerado o gráfico
                chart = document.getElementById(id);
                
                //Cria uma instancia do objeto ColumnChart
                Gmap.ElevationChart = new google.visualization.ColumnChart(chart);
                
                /*Adiciona o evento que faz com que um marcador percorra a rota enquanto o
                //mouse passa sobre o gráfico de altimetria
                google.visualization.events.addListener(Gmap.ElevationChart,'onmouseover',function (e) {
                    
                    //Cria um marcador de elevação
                    if(!Gmap.Markers['ElevationMarker']) {
                        
                        //Latitude e longitude do ponto atual
                        latLng = e.po
                        mark = 
                        Gmap = methods['AddMarkers'].apply(this,new Array())
                    }
                });*/
                
                
                //Instancia um objeto DataTable
                Gmap.Data = new google.visualization.DataTable();
                
                //Adiciona colunas
                Gmap.Data.addColumn('string','Sample');
                Gmap.Data.addColumn('number','Elevação');
                
                //Pega a path da Rota em array
                path = Gmap.Rota.getPath().getArray();
                
                //Adiciona os elementos de path ao grafico de elevação
                for(i in path) {
                    methods['AddElevationDate'].apply(this,new Array(path[i],Gmap));
                }
                
                return $.Gmap = Gmap;
            } catch(err) {
                console.error('Erro: '+err);
            }
        },
        
        /**
         * Adiciona os elementos de path ao grafico de elevação
         * @param LatLngsArray Array
         * @param Gmap object
         */
        AddElevationDate: function (LatLngsArray, Gmap) {
            try {
                //Valida o objeto
                Gmap = methods['ValideteGmap'].apply(this,new Array(Gmap));
                
                //Verifica a @var Elevation do objeto Gmap
                if(!Gmap.Elevation)
                    Gmap.Elevation = new Array();
                
                //Quantia de LatLngs da @var Gmap.Elevation
                lenElevation = Gmap.Elevation.length;
                
                //Array para adicionar rows aos graficos
                arrayRows = new Array();
                
                //Adiciona os valores de @var Gmap.Elevation e @var arrayRows
                for (i in LatLngsArray) {
                    Gmap.Elevation.push(LatLngsArray[i]);
                    
                    //Adiciona o ultimo elemento inserido na @var Gmap.Elevation 
                    //na @var arrayRows
                    arrayRows.push(['',Gmap.Elevation[lenElevation+i]]);
                }
                
                //Adiciona array
                Gmap.Data.addRows(arrayRows);
                
                //Gera o gráfico
                Gmap.ElevationChart.draw(Gmap.Data,options['ElevationChartOptions'])
            } catch(err) {
                console.error('Erro: '+err);
            }
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
         * Prepara uma imagem pra ser exibida no browser, adicionando a pasta raiz caso 
         * necessário
         * @param Icon
         * @param IconsFolder
         */
        ReturnIconUrl: function (Icon, IconsFolder) {
            try {
                //Valida @param Icon
                if(Icon) {
                    if(typeof Icon != 'string') throw "@param Icon não foi passado corretamente";
                } else {
                    return '';
                }
                
                //Valida @param IconsFolder
                //Verifica se @var IconsFolder não é string
                if(typeof IconsFolder != 'string') {
                    //Atribui o valor padrão para @var IconsFolder
                    IconsFolder = options['IconsFolder']+'/';
                    
                    //Verifica se @var IconsFolder é não é string
                    if(typeof IconsFolder != 'string' || IconsFolder == '/') {
                        IconsFolder = '';
                    }
                }
                
                Icon =  IconsFolder+Icon;
                
                //Retira Barras duplas (//) caso haja alguma
                Icon.replace('//','/');
                
                return Icon;
            } catch (err) {
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
                    if(e.icon)
                        icon = methods['ReturnIconUrl'].apply(this,new Array(e.icon));
                    
                    MarkerOptions.icon = icon;
                    
                    //Indice do novo marcador.
                    k = Gmap.Markers.length;
                    
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
         * Opções de Charts
         */ 
        ElevationChartOptions: {
            width: 945,
            height: 270,
            legend: 'none',
            titleY: 'Elevação (m)',
            focusBorderColor: '#00ff00'
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
        IconsFolder: '',
                
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
        Geometry: google.maps.geometry,
        
        /**
         * Intancia do objeto ElevationService
         * https://developers.google.com/maps/documentation/elevation/
         */
        ElevationService: new google.maps.ElevationService(),
        
        /**
         * Auxilio de ElevationService
         */
        ElevationSample: 256
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
                Return.push(methods['NewGmap'].apply(this, new Array(e)));
            } else {
                Return = $.Gmap = methods['NewGmap'].apply(this, new Array(e));
            }
        });
        
        return Return;        
    }
    
})( jQuery );