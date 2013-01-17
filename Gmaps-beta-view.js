// Load the Visualization API and the piechart package.
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

/**
 * Objetos Gmaps
 */
$.GmapsView = {
    /**
     * Opçoes do Objeto mapa 
     * google.maps.MapOptions
     * https://developers.google.com/maps/documentation/javascript/reference?hl=#MapOptions
     */
    gMapOptions: {
        zoom: 16,
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
     * Armazena o objeto Google Map
     * google.maps.Map
     * https://developers.google.com/maps/documentation/javascript/reference?hl=#Map
     */
    gMap:null,
    
    /**
     * Instancia do objeto Google Events
     * google.maps.event
     * https://developers.google.com/maps/documentation/javascript/reference?hl=#event
     */
    gEvent: google.maps.event,
    
    gElevationService: new google.maps.ElevationService(),
    
    gChart: null,
    
    gData: null,
    
    idDivChart: 'chart',
    
    gElevation: new Array,
    
    rota: null,
    
    SAMPLES: 256,
    mousemarker: null,
  
    /**
     * Indices padrões para marcadores
     */
    indicesMarker: {
        INICIO:'inicio',
        FIM:'fim'
    },
    
    /**
     * Opções padrões para Polyline
     * https://developers.google.com/maps/documentation/javascript/reference?hl=#PolylineOptions
     */ 
    opcoesPolyline: {
        strokeColor: "#4C4CFF",
        strokeOpacity: 0.6, 
        strokeWeight: 5,
        clickable:true
    },
    
    /**
     * Distancia total da rota (Soma de todas as distancias de todos os objetos rota)
     */
    distanciaPercorrida:0,
    
    /**
     * Distancia do ultimo marcador adicionado
     */
    distanciaUltimoMarker:0,
    
    /**
     *Array para armazenar objetos infowindow
     */
    infoWindow: new Array(),
    
    /**
     * Opções padrões para marcadores
     */
    opcoesMarkes: {
        INICIO:{
            icon:'/publico/imagens/markers/inicio.gif',
            zIndex:999
        },
        FIM:{
            icon:'/publico/imagens/markers/fim.gif',
            draggable: false,
            zIndex:9999
        }
    },
    
    /**
     * Array para armazenar marcadores
     */ 
    markers: new Array(),
    
    /*
     * Adiciona um marcador ao array de markers
     * @param pos Posição do marcador LatLng(obrigatório)
     * @param opcoes Opções adicionais do marcador (opcional) https://developers.google.com/maps/documentation/javascript/reference?hl=#MarkerOptions
     * @param Indice (string)Indice usado na hora de adicionar o array(opcional)
     * @return mark Objeto marcador
     */ 
    novoMarker: function (pos,opcoes,Indice) {
        //Opções marcador
        oMark = {
            map: $.GmapsView.gMap,
            draggable: true,
            position: pos
        }
        
        $.extend(oMark,opcoes);
        
        //objeto marcador
        mark = new google.maps.Marker(oMark);
        
        //Verifica se foi enviado um @param indice especifico ao marcador
        if(Indice) 
            //Adiciona adiciona o @param indice como id do objeto
            indice=Indice;
        else
            indice=$.GmapsView.markers.length;
        
        if(indice === true)
            indice = 0;
                
        //Adiciona o marcador no array markers no indice referente ao id do mesmo
        if($.GmapsView.markers[indice])
            $.GmapsView.markers[indice].setMap(null);
        
        $.GmapsView.markers[indice] = mark;
        
        return indice;
    },
    
    /*
     * Adiciona um marcador ao array de markers
     * @param pos Posição do InfoWindow LatLng(obrigatório)
     * @param content Html com o conteudo a ser adicionado no menu
     * @param maxWidth Int máximo de largura da janela
     * @param closed Controla se a infowindow deve ser criada aberta ou fechada
     * @param opcoesMarker Opções adicionais do marcador (opcional) https://developers.google.com/maps/documentation/javascript/reference?hl=#MarkerOptions
     * @param Indice (string)Indice usado na hora de adicionar o array(opcional)
     * @return info Objeto InfoWindow
     */ 
    novoInfoWindow: function (pos,content,maxWidth,closed,opcoesMarker,Indice) {
        if(maxWidth)
            maxWidth = 200;
        
        $.GmapsView.infoWindow.push(new google.maps.InfoWindow({
            content: content,
            maxWidth: maxWidth
        }));
        
        indice = $.GmapsView.novoMarker(pos, opcoesMarker, Indice);
        
        $.GmapsView.novoInfoWindowEvent($.GmapsView.markers[indice],$.GmapsView.infoWindow[$.GmapsView.infoWindow.length-1],closed)
    },
    
    novoInfoWindowEvent: function (mark,info,closed) {
        if(!closed)
            info.open($.GmapsView.gMap,mark); 
        
        $.GmapsView.gEvent.addListener(mark, 'click', function() {
            info.open($.GmapsView.gMap,mark);
        });
    },
    
    /**
     * Inicia a rota a ser editada
     */
    initRota: function () {
        $.GmapsView.opcoesPolyline.map = $.GmapsView.gMap;
        $.GmapsView.rota = new google.maps.Polyline($.GmapsView.opcoesPolyline);
        return true;
    },
    
    carregarRotaPorUrl: function (url,post) {
        $.post(url,post,function (data) {
            if(data.error == 0) {
                $.GmapsView.carregarRotaJson(data.coordenadas,data.rota.url_encoder);
            }
        },'json');
    },
    
    /**
     * Carrega uma rota via Ajax
     * @param jsonCoordenadas
     * @param urlEncoder
     */ 
    carregarRotaJson: function (jsonCoordenadas,urlEncoder) {
        //Inicia e renderiza a rota
        if($.GmapsView.initRota()) {
            path = $.GmapsView.rota.getPath();
            
            if(urlEncoder) {
                $.GmapsView.rota.setPath(google.maps.geometry.encoding.decodePath(urlEncoder));
                
                path = $.GmapsView.rota.getPath();
                if(path) {
                    $.GmapsView.novoMarker(path.getAt(0), $.GmapsView.opcoesMarkes.INICIO, $.GmapsView.indicesMarker.INICIO);
                    $.GmapsView.markers[$.GmapsView.indicesMarker.INICIO].setDraggable(false);
                }
            }
                        
            $.each(jsonCoordenadas, function (i,v) {
                latLng = new google.maps.LatLng(v.latitude,v.longitude);
                switch(parseInt(v.id_rotas_coordenadas_tipos)) {
                    case 1:
                        if(!urlEncoder) {
                            if(i == 0) {
                                $.GmapsView.novoMarker(latLng, $.GmapsView.opcoesMarkes.INICIO, $.GmapsView.indicesMarker.INICIO);
                                $.GmapsView.markers[$.GmapsView.indicesMarker.INICIO].setDraggable(false);
                                path.push(latLng);
                            }
                        }
                    
                        break;
                    case 2:
                        $.GmapsView.novoMarker(latLng,{
                            icon:'/publico/imagens/markers/gota.png',
                            draggable:false
                        });
                        break;
                    case 3:
                        divBox = document.createElement('div');
                        divBox.setAttribute('class', 'box-infowindow');
                
                        txt = document.createTextNode(v.comentario);
                        divBox.appendChild(txt);
                        $.GmapsView.novoInfoWindow(latLng, divBox, 200,true,{
                            icon:'/publico/imagens/markers/coment.gif',
                            draggable:false
                        });
                        break;
                }
            });
            
            $.GmapsView.calcularDistanciaRota(function (d) {
                $.GmapsView.recalcularMarcadoresDistancia(d);
            });
            
            $.GmapsView.centralizarMap();
        }
    },
    
    /**
     * Centraliza o mapa baseado na rota atual
     */ 
    centralizarMap: function () {
        path = $.GmapsView.rota.getPath();
       
        bounds = new google.maps.LatLngBounds();
        path.forEach(function (e) {
            bounds.extend(e);
        });
       
        $.GmapsView.gMap.fitBounds(bounds);
    },
    
    /**
     * Calcula a distancia com base na rota completa 
     * @return double 
     */
    calcularDistanciaRota: function (callback,path) {
        if(!path)
            path = $.GmapsView.rota.getPath();
        
        if(path)
            $.GmapsView.distanciaPercorrida = google.maps.geometry.spherical.computeLength(path);
        else
            $.GmapsView.distanciaPercorrida = 0;
        
        if(callback)
            callback($.GmapsView.distanciaPercorrida);
        
        return $.GmapsView.distanciaPercorrida;
    },
    
    recalcularMarcadorFim: function (latLng) {
        if(!latLng) {
            path = $.GmapsView.rota.getPath();
            latLng = path.getAt(path.length-1);
        }
        
        if($.GmapsView.markers[$.GmapsView.indicesMarker.FIM]) {
            $.GmapsView.markers[$.GmapsView.indicesMarker.FIM].setPosition(latLng);
        } else {
            $.GmapsView.novoMarker(latLng, $.GmapsView.opcoesMarkes.FIM, $.GmapsView.indicesMarker.FIM);
        } 
    },
    
    recalcularMarcadoresDistancia: function (d) {
        distancia = Math.floor((!d && d != 0 ? $.GmapsView.distanciaPercorrida : d) / 1000);
        // Rota aumentou
        //Verifica se a distancia está entre zero e o ultimo marcador
        if(distancia > 0 && $.GmapsView.distanciaUltimoMarker <= distancia) {
            while($.GmapsView.distanciaUltimoMarker < distancia) {
                opcoesMark = {
                    icon: '/publico/imagens/markers/'+($.GmapsView.distanciaUltimoMarker+1)+'.gif',
                    draggable:false
                };
                indice = 'km'+$.GmapsView.distanciaUltimoMarker;
                $.GmapsView.novoMarker($.GmapsView.rota.getPointAtDistance(1000 * ($.GmapsView.distanciaUltimoMarker + 1)), opcoesMark, indice);
                $.GmapsView.distanciaUltimoMarker++;
            }
        }
        $.GmapsView.recalcularMarcadorFim();
    },
    
    /**
     * Inicia os Gráficos de altimetria
     */ 
    initChart: function () {
        chart = document.getElementById($.GmapsView.idDivChart);
        
        //verifica se existe uma div para carregar os Gráficos de altimetria
        if(!chart)
            return;
        
        //Inicia os gráficos na div
        $.GmapsView.gChart = new google.visualization.ColumnChart(chart);
        
        //Adiciona o evento que faz com que um marcador percorra a rota enquanto o
        //mouse passa sobre o gráfico de altimetria
        google.visualization.events.addListener($.GmapsView.gChart, 'onmouseover', function(e) {
            //verifica se existe um marcador para percorrer a rota
            if ($.GmapsView.mousemarker == null) {
                //Cria um marcador para percorrer a rota
                $.GmapsView.mousemarker = new google.maps.Marker({
                    position: $.GmapsView.gElevation[e.row].location,
                    map: $.GmapsView.gMap,
                    icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                    zIndex: 99999
                });
            } else {
                //Posiciona o marcador referente ao valor do gráfico aonde o mouse se encontra
                $.GmapsView.mousemarker.setPosition($.GmapsView.gElevation[e.row].location);
            }
        });
        
        //Cria um objeto DataTable
        $.GmapsView.gData = new google.visualization.DataTable();
        $.GmapsView.gData.addColumn('string', 'Sample');
        $.GmapsView.gData.addColumn('number', 'Elevação');
        
        //Recupera o array de latLng da rota
        path = $.GmapsView.rota.getPath().getArray();
        a = 0;
        b = 0;
        array = new Array();
        
        for(i in path) {
            if(a <= 200) {
                if($.isArray(array[b])) {
                    array[b][a]=path[i];
                } else {
                    array[b] = new Array();
                    array[b][a]=path[i];
                }
                a++;
            } else {
                b++;
                a = 0;
                array[b] = new Array();
                array[b][a]=path[i];
            }
        }
        
        for(i in array) {
            $.GmapsView.retornaDataElevacao(array[i]);
        }
    },
    
    retornaDataElevacao: function (array) {
        $.GmapsView.gElevationService.getElevationAlongPath({
            path: array,
            samples: $.GmapsView.SAMPLES
        },$.GmapsView.addElevation);
    },
    
    addElevation: function (r) {
        l = $.GmapsView.gElevation.length;
        
        for (i = 0; i < r.length; i++) {
            $.GmapsView.gElevation.push(r[i]);
            $.GmapsView.gData.addRow(['', $.GmapsView.gElevation[l+i].elevation]);
        }
        
        $.GmapsView.gChart.draw($.GmapsView.gData, {
            width: 945,
            height: 270,
            legend: 'none',
            titleY: 'Elevação (m)',
            focusBorderColor: '#00ff00'
        });
    },
    
    limparMousemarker: function () {
        if($.GmapsView.mousemarker) {
            $.GmapsView.mousemarker.setMap(null);
            $.GmapsView.mousemarker = null;
        }
    },

    /**
     * Inicia o plugin
     * @param div Div(Elemento HTML) aonde será renderizado o mapa
     * @return Boolean|Void
     */
    init: function (div) {
        //Retorna false se não for passado uma div
        if(!div) return false;
        
        //Atribui um Id a Div caso ela não possua um
        if(!this.id) this.id = 'GmapId';
        
        //Se nenhuma mapa está criado, instancia um objeto Google Maps
        if(!$.GmapsView.gMap)    
            $.GmapsView.gMap = new google.maps.Map(div, $.GmapsView.gMapOptions);

        return true;
    }
}

/**
 * Função inicial do plugin
 * @param opcoes
 */
$.fn.GmapsView = function (opcoes) {
    //Verifica se as opções tentam alterar os valores padrões de maps
    if(opcoes.gMapOptions)
        $.extend($.GmapsView.gMapOptions,opcoes.gMapOptions);
    
    //Verifica se foi passado algum id de chart
    if(opcoes.idDivChart)
        $.GmapsView.idDivChart= opcoes.idDivChart;
   
    //Percorre todos os elementos selecionados. Porem só cria um mapa
    return this.each(function () {
        //Atribui um Id a Div caso ela não possua um
        if(!this.id) this.id = 'GmapId';
                
        $.GmapsView.init(this);
    });
}