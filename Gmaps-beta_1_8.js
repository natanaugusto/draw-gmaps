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
$.Gmaps = {
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
    
    kink:20,
    
    /**
     * Armazena o objeto Google Map
     * google.maps.Map
     * https://developers.google.com/maps/documentation/javascript/reference?hl=#Map
     */
    gMap:null,
    
    /**
     * Instancia do objeto Google Geocoder
     * google.maps.Geocoder
     * https://developers.google.com/maps/documentation/javascript/reference?hl=#Geocoder
     */
    gGeocoder: new google.maps.Geocoder(),
    
    /**
     * Instancia do objeto Google Directions Service
     * google.maps.DirectionsService
     * https://developers.google.com/maps/documentation/javascript/reference?hl=#DirectionsService
     */
    gDirectionsService: new google.maps.DirectionsService(),
    
    /**
     * Instancia do objeto Google Events
     * google.maps.event
     * https://developers.google.com/maps/documentation/javascript/reference?hl=#event
     */
    gEvent: google.maps.event,
    
    /**
     * Callback executada quando o método tracarRotas é executado com 
     * @param rota array com latLng da rota completa
     * @param distanciaPercorrida total de distancia percorrida por todas as rotas
     */
    callbackTracarRotas:null,
    
    /**
     * Callback executada quando o método calcularDistanciaRota
     * @param distanciaPercorrida
     */
    callbackDistanciaRota: null,
    
    /**
     * Callback executada quando o método calcularDistanciaRota
     * @param distanciaPercorrida
     */
    callbackAtualizarEndereco: null,
    
    /**
     * 
     
    /**
     * Opções de navegação
     * Prove os valores padrões para cada tipo navegação e métodos para alterar 
     * o status de navegação do site
     */
    navegacao: {
        /**
         * Status ultilizado quando esta traçando uma rota
         */ 
        navegando: 0,
        
        /**
         * Status ultilizado quando esta traçando uma rota
         */ 
        addRota: 1,
        
        /**
         * Status ultilizado quando esta adicionando um marcador
         */
        addMark: 2,
        
        /**
         * Status ultilizado quando esta adicionando um marcador de comentários
         */
        addComentario: 3,
        
        /**
         * Status ultilizado quando esta adicionando um marcador de agua
         */
        addAgua: 4,
        
        /*
         * Prove os metodos para alterar o status
         */
        alterar: {
            /**
             * Altera o status para navegando
             */ 
            navegando: function () {
                if($.Gmaps.excluirMarkers === true)
                    $.Gmaps.alterarExcluirMarkers();
                if($.Gmaps.edicaoRota === true)
                    $.Gmaps.alterarEdicaoRota();
                $.Gmaps.statusNavegacao = $.Gmaps.navegacao.addRota;
            },
            
            /**
             * Altera o status para addRota
             */ 
            addRota: function () {
                if($.Gmaps.excluirMarkers === true)
                    $.Gmaps.alterarExcluirMarkers();
                if($.Gmaps.edicaoRota === true)
                    $.Gmaps.alterarEdicaoRota();
                $.Gmaps.statusNavegacao = $.Gmaps.navegacao.addRota;
            },
            
            /**
             * Altera o status para addMark
             */ 
            addMark: function () {
                if($.Gmaps.excluirMarkers === true)
                    $.Gmaps.alterarExcluirMarkers();
                if($.Gmaps.edicaoRota === true)
                    $.Gmaps.alterarEdicaoRota();
                $.Gmaps.statusNavegacao = $.Gmaps.navegacao.addMark;
            },
            
            /**
             * Altera o status para addComentario
             */ 
            addComentario: function () {
                if($.Gmaps.excluirMarkers === true)
                    $.Gmaps.alterarExcluirMarkers();
                if($.Gmaps.edicaoRota === true)
                    $.Gmaps.alterarEdicaoRota();
                $.Gmaps.statusNavegacao = $.Gmaps.navegacao.addComentario;
            },
            
            /**
             * Altera o status para addComentario
             */ 
            addAgua: function () {
                if($.Gmaps.excluirMarkers === true)
                    $.Gmaps.alterarExcluirMarkers();
                if($.Gmaps.edicaoRota === true)
                    $.Gmaps.alterarEdicaoRota();
                $.Gmaps.statusNavegacao = $.Gmaps.navegacao.addAgua;
            }
        }
    },
    
    excluirMarkers: false,
    
    /**
     *Array para armazenar objetos infowindow
     */
    infoWindow: new Array(),
    
    /**
     * Array para armazenar o historico de LatLng adicionados por click
     */ 
    historicoPontos: new Array(),
    
    /**
     * Distancia total da rota (Soma de todas as distancias de todos os objetos rota)
     */
    distanciaPercorrida:0,
    
    /**
     * Distancia do ultimo marcador adicionado
     */
    distanciaUltimoMarker:0,
    
    /*
     * Armazena o status atual da rota
     */
    statusNavegacao: null,
    
    /*
     * Alterna entre o modo seguir ruas e não seguir
     */ 
    seguirRuas:{
        /**
         * @var seguirRuas.status Status do seguir rua
         */ 
        status: true,
        /*
         * @function on Habilita o seguir ruas
         */
        on: function () {
            $.Gmaps.seguirRuas.status = true;
        },
        
        /*
         * @function off Desabilita o seguir ruas
         */
        off: function () {
            $.Gmaps.seguirRuas.status = false;
        }
    },
    
    /**
     * Indices padrões para marcadores
     */
    indicesMarker: {
        INICIO:'inicio',
        FIM:'fim'
    },
    
    //PEPE A VELA
    indicesMarksKM: new Array(),
    
    /**
     * Opções padrões para marcadores
     */
    opcoesMarkes: {
        INICIO:{
            icon: '/publico/imagens/markers/inicio.gif',
            zIndex:999
        },
        FIM:{
            icon:'/publico/imagens/markers/fim.gif',
            draggable: false,
            zIndex:9999
        }
    },
    
    /*
     * Variavél de controle para a função de apagar elementos na rota
     */
    edicaoRota: false,
    
    /**
     *Eventos ultilizados pelo modo de edicao
     */
    eventos: new Array,
    
    /**
     * Armazena a imagem de marcador atual
     */
    imgMarkerAtual:null,
    
    /**
     * Array para armazenar marcadores
     */ 
    markers: new Array(),
    
    /**
     * Armazena um objeto Google Polyline
     * https://developers.google.com/maps/documentation/javascript/reference?hl=#Polyline
     */ 
    rota: null,
    
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
     * Inicia a rota a ser editada
     */
    initRota: function () {
        $.Gmaps.opcoesPolyline.map = $.Gmaps.gMap;
        $.Gmaps.rota = new google.maps.Polyline($.Gmaps.opcoesPolyline);
        return true;
    },
    
    /**
     * Limpar Rota
     * Elimina todos os pontos da rota
     */
    limparRota: function () {
        $.Gmaps.distanciaPercorrida = 0;
        $.Gmaps.distanciaUltimoMarker = 0;
        if($.Gmaps.rota)
            $.Gmaps.rota.getPath().clear();
        //Zera a rota
        $.Gmaps.rota = null;
        //Zera os marcadores
        $.Gmaps.removeMarkers();
    },
    
    /**
     * Remove marcadores. Se o parametro key for informado, remove apenas o marker indicado.
     * Se não, remove todos os markers
     * @param key Indice do array a ser excluido
     */ 
    removeMarkers: function (key) {
        //Remove o marker do indice especifico
        if(key) {
            $.Gmaps.markers[key].setMap(null);
            $.Gmaps.merkers[key] = null;
        } else {
            for(k in $.Gmaps.markers) {
                $.Gmaps.markers[k].setMap(null);
            }
            $.Gmaps.markers = new Array();
        }
    },
    /**
     * Edicao
     */
    alterarEdicaoRota: function () {
        if($.Gmaps.excluirMarkers === true)
            $.Gmaps.alterarExcluirMarkers();
            
        if($.Gmaps.edicaoRota === false) {
            $.Gmaps.edicaoRota = true;
            
            if($.Gmaps.rota) {
                path = $.Gmaps.rota.getPath();
                
                $.Gmaps.rota.setPath(GDouglasPeucker(path.getArray(), $.Gmaps.kink));
                $.Gmaps.rota.setEditable(true);
                
                $.Gmaps.eventos.push(
                    $.Gmaps.gEvent.addListener($.Gmaps.rota, 'dblclick', function (ret) {
                        if(ret.vertex) {
                            path = $.Gmaps.rota.getPath();
                            $.Gmaps.historicoPontos.push(google.maps.geometry.encoding.encodePath(path));
                            path.removeAt(ret.vertex);
                            
                            $.Gmaps.calcularDistanciaRota(function (d) {
                                for(--$.Gmaps.distanciaUltimoMarker; $.Gmaps.distanciaUltimoMarker > 0; $.Gmaps.distanciaUltimoMarker--) {
                                    $.Gmaps.markers['km'+$.Gmaps.distanciaUltimoMarker].setMap(null);
                                }
                                $.Gmaps.recalcularMarcadoresDistancia(d);
                            });
                        }
                    }));
                    
                $.Gmaps.eventos.push(
                    $.Gmaps.gEvent.addListener($.Gmaps.rota.getPath(), 'set_at', function () {
                        path = $.Gmaps.rota.getPath();
                        $.Gmaps.historicoPontos.push(google.maps.geometry.encoding.encodePath(path));
                            
                        $.Gmaps.calcularDistanciaRota(function (d) {
                            for(--$.Gmaps.distanciaUltimoMarker; $.Gmaps.distanciaUltimoMarker > 0; $.Gmaps.distanciaUltimoMarker--) {
                                $.Gmaps.markers['km'+$.Gmaps.distanciaUltimoMarker].setMap(null);
                            }
                            $.Gmaps.recalcularMarcadoresDistancia(d);
                        });
                    }));
            }
        } else if($.Gmaps.edicaoRota === true){ 
            if($.Gmaps.rota) {
                $.Gmaps.rota.setEditable(false);
            }
            
            $.Gmaps.edicaoRota = false;
        }
    },
            
    alterarExcluirMarkers: function () {
        if($.Gmaps.edicaoRota === true)
            $.Gmaps.alterarEdicaoRota();
        
        if($.Gmaps.excluirMarkers === false) {
            $.Gmaps.excluirMarkers = true;
            markersLen = $.Gmaps.markers.length;
            if(markersLen > 0) {
                for(i = 0; i < markersLen; i++) {
                    $.Gmaps.eventos.push($.Gmaps.addEventMarker('click',$.Gmaps.markers[i],function (m) {
                        m.setMap(null);
                    }));
                }
            }                        
        } else if($.Gmaps.excluirMarkers === true) {
            $.Gmaps.excluirMarkers = false;
            if($.Gmaps.eventos.length > 0) {
                for(i in $.Gmaps.eventosEdicao) {
                    $.Gmaps.gEvent.removeListener($.Gmaps.eventosEdicao[i]);
                }
            }
        }
    },
    
    addEventMarker: function (event,marker,callback) {
        return $.Gmaps.gEvent.addListener(marker, event, function () {
            if(callback)
                callback(marker);
        });
    },

    /**
     * Altera o marcador atual
     * @param img (string com o caminho do marcador)
     * @return bool
     */
    alterarImgMarkerAtual: function (img) {
        if($.Gmaps.imgMarkerAtual) {
            $.Gmaps.imgMarkerAtual = img;
            return true;
        } else
            return false;
    },
    
    tracarVolta: function () {
        if($.Gmaps.rota)
            //Pega a path da rota atual
            path = $.Gmaps.rota.getPath();
        else
            return;
        
        $.Gmaps.historicoPontos.push(google.maps.geometry.encoding.encodePath(path));
        //Verifica se a path tem mais um minimo de 2 elementos
        if(path.getLength() < 2)
            return;
       
        len = path.getLength()-1;
        array = new Array();
       
        for(len;len >= 0;len--) {
            array.push(path.getAt(len));
        }
        
        $.Gmaps.alterarRota(array)
        $.Gmaps.calcularDistanciaRota(function (d) {
            $.Gmaps.recalcularMarcadoresDistancia(d);
        });
    },
    
    /*
     * Traça a rota e recalcula os pontos
     */ 
    tracarRota: function (e) {
        //Verifica se existe um marcador inicial
        if(!$.Gmaps.markers[$.Gmaps.indicesMarker.INICIO]) {
            //Adiciona um marcador inicial
            if($.Gmaps.novoMarker(e.latLng, $.Gmaps.opcoesMarkes.INICIO, $.Gmaps.indicesMarker.INICIO)==$.Gmaps.indicesMarker.INICIO)
                return;
        } else {
            //Se o marcador inicial possibilitar o arraste, cancela essa opção
            if($.Gmaps.markers[$.Gmaps.indicesMarker.INICIO].getDraggable())
                $.Gmaps.markers[$.Gmaps.indicesMarker.INICIO].setDraggable(false);
                
            //Pega a path do objeto
            path = $.Gmaps.rota.getPath();
            $.Gmaps.historicoPontos.push(google.maps.geometry.encoding.encodePath(path));
            //Função call backque será acionada antes de plotar  a rota
            callbackRS = null;
            
            inicio = false;
            //Verifica se á foi adicionado algum ponto 
            if(path.length==0) {
                inicio = true
            }
            
            if($.Gmaps.seguirRuas.status) {
                //Objeto Google Direction Request que sera enviado a um Google Directions Services
                dRequest = {
                    travelMode: google.maps.DirectionsTravelMode.WALKING
                };
                
                //Verifica se é o inico da rota
                if(inicio) {
                    dRequest.origin = $.Gmaps.markers[$.Gmaps.indicesMarker.INICIO].getPosition();
                    
                    //Callback adicional para RequestService
                    //@param latLng
                    callbackRS = function (r) {
                        $.Gmaps.markers[$.Gmaps.indicesMarker.INICIO].setPosition(r[0]);
                    }
                } else {
                    dRequest.origin = $.Gmaps.rota.getPath().getAt($.Gmaps.rota.getPath().length-1);
                    //Callback adicional para RequestService
                    //@param latLng
                    callbackRS = function (r) {
                        path=$.Gmaps.rota.getPath();
                        path.setAt(path.length-1,r[0]);
                    }
                }
                
                dRequest.destination = e.latLng;            
                
                //Envia um objeto request para o Directions Service do Google para 
                //pegar a rota seguindo ruas 
                $.Gmaps.gDirectionsService.route(dRequest, function (r, s) {
                    //Verifica o status do retorno
                    if(s == google.maps.DirectionsStatus.OK) {
                        //Pega todos os pontos LatLng criados pelo retorno
                        overviewPath = r.routes[0].overview_path;
                        //Veri se há algum evento callback
                        if(callbackRS)
                            callbackRS(overviewPath);
                        
                        $.Gmaps.alterarRota(overviewPath);
                        $.Gmaps.calcularDistanciaRota(function (d) {
                            $.Gmaps.recalcularMarcadoresDistancia(d);
                        });
                    }
                });
            } else {
                //Verifica se é o inico da rota
                if(inicio)
                    ////Adiciona o ponto do marcador como primeiro ponto da rota
                    $.Gmaps.alterarRota($.Gmaps.markers[$.Gmaps.indicesMarker.INICIO].getPosition());
                
                //Altera os maps
                $.Gmaps.alterarRota(e.latLng)
                $.Gmaps.calcularDistanciaRota(function (d) {
                    $.Gmaps.recalcularMarcadoresDistancia(d);
                });
            }
        }

        if($.Gmaps.callbackTracarRotas)
            $.Gmaps.callbackTracarRotas($.Gmaps.rota,$.Gmaps.distanciaPercorrida);
    },
    
    /**
     * Volta para o ultimo ponto adicionado na rota
     */ 
    voltarUm: function () {
        //Verifica se já há historicos adicionados
        if($.Gmaps.historicoPontos.length > 0) {
            path = $.Gmaps.historicoPontos[$.Gmaps.historicoPontos.length-1];
            $.Gmaps.historicoPontos.pop();
            
            $.Gmaps.rota.setPath(google.maps.geometry.encoding.decodePath(path));
                
            $.Gmaps.calcularDistanciaRota(function (d) {
                $.Gmaps.recalcularMarcadoresDistancia(d);
            });
        }
    }, 
    
    /**
     * Altera a rota desenhada no mapa atual com base nos parametros enviados
     * @param latLng MVCArray de LatLng para ser adicionado ao path da rota
     * @param sub (int) quantia de latLngs a serem subtraidos do path da rota
     * @return int Retorna a diferença entre a path depois da alteração(Negativo se for menor que no inicio e positivo se for maior)
     */
    alterarRota: function (latLng,sub) {
        //Pega a path do objeto
        path = $.Gmaps.rota.getPath();
        
        //Total de latLng no inicio da função
        lenIni = path.length;
        
        //Verifica se dever ser subtraido algum ponto 
        if(sub) {
            if(sub == path.length) {
                path.clear();
                
                if(!$.Gmaps.markers[$.Gmaps.indicesMarker.INICIO].getDraggable())
                    $.Gmaps.markers[$.Gmaps.indicesMarker.INICIO].setDraggable(true);
                
                $.Gmaps.rota=null;
            } else {
                //Enquanto @param sub for maior que zero, será revovido um elemento
                // do MVCArray
                while(sub > 0) {
                    path.pop();
                    sub--;
                }
            }
        }
        
        //Verifica se foi passado um latLng
        if(latLng) {
            if($.isArray(latLng)) {
                $.each(latLng, function (i,e) {
                    path.push(e);
                });
            } else {
                path.push(latLng);
            }
        }
        
        $.Gmaps.recalcularMarcadorFim(path.getAt(path.length-1));
        
        //Total de latLng no fim da função
        lenFim = path.length;
        
        return lenFim-lenIni;
    },
    
    recalcularMarcadorFim: function (latLng) {
        if($.Gmaps.rota) {
            if(!latLng) {
                path = $.Gmaps.rota.getPath();
                latLng = path.getAt(path.length-1);
            }
        
            if($.Gmaps.markers[$.Gmaps.indicesMarker.FIM]) {
                $.Gmaps.markers[$.Gmaps.indicesMarker.FIM].setPosition(latLng);
            } else {
                $.Gmaps.novoMarker(latLng, $.Gmaps.opcoesMarkes.FIM, $.Gmaps.indicesMarker.FIM);
            }
        } else {
            if($.Gmaps.markers[$.Gmaps.indicesMarker.FIM]) {
                $.Gmaps.markers[$.Gmaps.indicesMarker.FIM].setMap(null);
            }
        }
    },
    
    /**
     * Calcula a distancia com base na rota completa 
     * @return double 
     */
    calcularDistanciaRota: function (callback,path) {
        if(!path)
            path = $.Gmaps.rota ? $.Gmaps.rota.getPath() : null;
        
        if(path)
            $.Gmaps.distanciaPercorrida = google.maps.geometry.spherical.computeLength(path);
        else
            $.Gmaps.distanciaPercorrida = 0;
        
        if($.Gmaps.callbackDistanciaRota)
            $.Gmaps.callbackDistanciaRota($.Gmaps.distanciaPercorrida);
        
        if(callback)
            callback($.Gmaps.distanciaPercorrida);
        
        return $.Gmaps.distanciaPercorrida;
    },
    
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
            map: $.Gmaps.gMap,
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
            indice=$.Gmaps.markers.length;
        
        if(indice === true)
            indice = 0;
                
        //Adiciona o marcador no array markers no indice referente ao id do mesmo
        if($.Gmaps.markers[indice])
            $.Gmaps.markers[indice].setMap(null);
        
        $.Gmaps.markers[indice] = mark;
        
        return indice;
    },
    
    recalcularMarcadoresDistancia: function (d) {
        distancia = Math.floor((!d && d != 0 ? $.Gmaps.distanciaPercorrida : d) / 1000);
        
        // Rota aumentou
        //Verifica se a distancia está entre zero e o ultimo marcador
        if(distancia > 0 && $.Gmaps.distanciaUltimoMarker <= distancia) {
            while($.Gmaps.distanciaUltimoMarker < distancia) {
                opcoesMark = {
                    icon: '/publico/imagens/markers/'+($.Gmaps.distanciaUltimoMarker+1)+'.gif',
                    draggable:false
                };
                indice = 'km'+$.Gmaps.distanciaUltimoMarker;
                $.Gmaps.novoMarker($.Gmaps.rota.getPointAtDistance(1000 * ($.Gmaps.distanciaUltimoMarker + 1)), opcoesMark, indice);
                $.Gmaps.distanciaUltimoMarker++;
            }
        }
        //Rota diminuiu
        else {
            if(distancia > 0)
                i = $.Gmaps.distanciaUltimoMarker-distancia;
            else
                i = $.Gmaps.distanciaUltimoMarker;
            
            a = $.Gmaps.distanciaUltimoMarker-1;
            
            for(i;i>0;i--) {
                indice = 'km'+a;
                $.Gmaps.markers[indice].setMap(null);
                $.Gmaps.markers[indice] = null;
                $.Gmaps.distanciaUltimoMarker--;
                a--;
            }
        }
        $.Gmaps.recalcularMarcadorFim();
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
        
        $.Gmaps.infoWindow.push(new google.maps.InfoWindow({
            content: content,
            maxWidth: maxWidth
        }));
        
        indice = $.Gmaps.novoMarker(pos, opcoesMarker, Indice);
        
        $.Gmaps.novoInfoWindowEvent($.Gmaps.markers[indice],$.Gmaps.infoWindow[$.Gmaps.infoWindow.length-1],closed)
    },
    
    novoInfoWindowEvent: function (mark,info,closed) {
        if(!closed)
            info.open($.Gmaps.gMap,mark); 
        
        $.Gmaps.gEvent.addListener(mark, 'click', function() {
            info.open($.Gmaps.gMap,mark);
        });
    },
    
    /**
     * Filtra o evento click do mouse
     * @param e Evento ativado pelo mapa
     */
    filtroEventClick: function (e) {
        //Verifica o tipo de ação que deve ser executada
        switch($.Gmaps.statusNavegacao) {
            case $.Gmaps.navegacao.addRota:
                if($.Gmaps.rota==null)
                    $.Gmaps.initRota();
                $.Gmaps.tracarRota(e);
                break;
                
            case $.Gmaps.navegacao.addMark:
                $.Gmaps.novoMarker(e.latLng);
                break;
                
            case $.Gmaps.navegacao.addAgua:
                $.Gmaps.novoMarker(e.latLng,{
                    icon:'/publico/imagens/markers/gota.png'
                });
                break;
                
            case $.Gmaps.navegacao.addComentario:
                divBox = document.createElement('div');
                divBox.setAttribute('class', 'box-infowindow');
                
                textarea = document.createElement('textarea');
                divBox.appendChild(textarea);
                
                $.Gmaps.novoInfoWindow(e.latLng, divBox, 200,false,{
                    icon:'/publico/imagens/markers/coment.gif'
                });
                break;
        }
    },
    
    /**
     * Centraliza o mapa com base em um endereço
     * @param endereco (String)Endereço que será centralizado o mapa
     * @param zoom (Int)Zoom
     */
    centralizarMapaEm:function (endereco, zoom) {
        if (!zoom)
            zoom = 16;
        
        $.Gmaps.gGeocoder.geocode({
            "address": endereco
        }, function(r,s) {
            if(google.maps.GeocoderStatus.OK == s)
                if (r.length > 0) {
                    $.Gmaps.gMap.setCenter(r[0].geometry.location);
                    $.Gmaps.gMap.setZoom(zoom);
                }
        });
    },
        
    /**
     * Recupera os dados da rota atual. Retorna um jason com todos os latLngs
     * Valores atribuidos 
     * 1 Ponto (Ponto na latLng na rota)
     * 2 Água (marcação de água)
     * 3 Comentários (marcação de comentários)
     */
    recuperarDados: function () {
        if($.Gmaps.gMap) {
            //Pega o centro do mapa no momento
            center = $.Gmaps.gMap.getCenter();
            ret = {
                "rota":{
                    "latitude_center": center.lat(),
                    "longitude_center": center.lng(),
                    "distanciaPercorrida": $.Gmaps.distanciaPercorrida,
                    "endereco": $.Gmaps.endereco
                },
                "coordenadas":new Array
            };
        
            //pega todas as coordenadas da rota
            if($.Gmaps.rota) {
                //Pega todos os latLng da rota
                path = $.Gmaps.rota.getPath();
                path = GDouglasPeucker(path.getArray(), $.Gmaps.kink);
                ret.rota.enc = google.maps.geometry.encoding.encodePath(path);
            }
        
            //Pega os marcadores de água
            if($.Gmaps.markers && $.Gmaps.markers.length > 0) {
                iconComment = 'coment.gif';
                i = $.Gmaps.markers.length;
                //Pega todos os marcadores
                for(k=0; k < i;k++) {
                    mark = $.Gmaps.markers[k];
                    e = mark.getPosition();
                    icon = mark.getIcon();
                    //PEPE A VELA
                    if(icon.search('gota') > -1) {
                        ret.coordenadas.push({
                            "latitude":e.lat(),
                            "longitude":e.lng(),
                            "comentario":null,
                            "id_rotas_coordenadas_tipos":2,
                            "icone": icon
                        });
                    } else if(icon.search('coment') > -1)
                        iconComment = icon;
                }
            
                //Pega todos os comentários
                if($.Gmaps.infoWindow && $.Gmaps.infoWindow.length > 0) {
                    for(i in $.Gmaps.infoWindow) {
                        $.Gmaps.infoWindow[i].close();
                        e = $.Gmaps.infoWindow[i].getPosition();
                        if(e) {
                            info = $($.Gmaps.infoWindow[i].getContent()).children('textarea').val();
                            ret.coordenadas.push({
                                "latitude":e.lat(),
                                "longitude":e.lng(),
                                "comentario":info,
                                "id_rotas_coordenadas_tipos":3,
                                "icone":iconComment
                            });
                        }
                    }
                }
            }
            return ret;
        } else {
            return null;
        }
    },
    
    atualizarEndereco: function () {
        $.Gmaps.endereco = {
            cidade:null,
            estado:null,
            pais:null,
            bairro:null
        };
        $.Gmaps.gGeocoder.geocode({
            'latLng':$.Gmaps.gMap.getCenter()
        },function (result,status){
            if(google.maps.GeocoderStatus.OK == status) {
                address = result[0].address_components;
                
                for(i in address) {
                    if($.inArray('locality', address[i].types) > -1) {
                        $.Gmaps.endereco.cidade = address[i].long_name;
                    }
                    if($.inArray('administrative_area_level_1', address[i].types) > -1) {
                        $.Gmaps.endereco.estado = address[i].long_name;
                    }
                    if($.inArray('country', address[i].types) > -1) {
                        $.Gmaps.endereco.pais = address[i].long_name;
                    }
                    if($.inArray('sublocality', address[i].types) > -1) {
                        $.Gmaps.endereco.bairro = address[i].long_name;
                    }
                }
                
                if($.Gmaps.callbackAtualizarEndereco)
                    $.Gmaps.callbackAtualizarEndereco($.Gmaps.endereco);
            }
        });
    },
    
    /**
     * Centraliza o mapa baseado na rota atual
     */ 
    centralizarMap: function () {
        path = $.Gmaps.rota.getPath();
       
        bounds = new google.maps.LatLngBounds();
        path.forEach(function (e) {
            bounds.extend(e);
        });
       
        $.Gmaps.gMap.fitBounds(bounds);
    },
    
    carregarRotaPorUrl: function (url,post) {
        $.post(url,post,function (data) {
            if(data.error == 0) {
                $.Gmaps.carregarRotaJson(data.coordenadas,data.rota.url_encoder);
            }
        },'json');
    },
    
    /**
     * Carrega uma rota via Ajax
     * @param jsonCoordenadas
     * @param urlEncoder
     */ 
    carregarRotaJson: function (jsonCoordenadas,urlEncoder) {
        $.Gmaps.seguirRuas.status = false;
        //Inicia e renderiza a rota
        if($.Gmaps.initRota()) {
            path = $.Gmaps.rota.getPath();
            
            if(urlEncoder) {
                $.Gmaps.rota.setPath(google.maps.geometry.encoding.decodePath(urlEncoder));
                
                path = $.Gmaps.rota.getPath();
                if(path) {
                    $.Gmaps.novoMarker(path.getAt(0), $.Gmaps.opcoesMarkes.INICIO, $.Gmaps.indicesMarker.INICIO);
                    $.Gmaps.markers[$.Gmaps.indicesMarker.INICIO].setDraggable(false);
                }
            }
            
            $.each(jsonCoordenadas, function (i,v) {
                latLng = new google.maps.LatLng(v.latitude,v.longitude);
                switch(parseInt(v.id_rotas_coordenadas_tipos)) {
                    case 1:
                        if(!urlEncoder){
                            if(i == 0) {
                                $.Gmaps.novoMarker(latLng, $.Gmaps.opcoesMarkes.INICIO, $.Gmaps.indicesMarker.INICIO);
                                $.Gmaps.markers[$.Gmaps.indicesMarker.INICIO].setDraggable(false);
                            }
                            path.push(latLng);
                        }
                        break;
                    case 2:
                        $.Gmaps.novoMarker(latLng,{
                            icon:'/publico/imagens/markers/gota.png'
                        });
                        break;
                    case 3:
                        divBox = document.createElement('div');
                        divBox.setAttribute('class', 'box-infowindow');
                
                        textarea = document.createElement('textarea');
                        txt = document.createTextNode(v.comentario);
                        textarea.appendChild(txt);
                        divBox.appendChild(textarea);
                        $.Gmaps.novoInfoWindow(latLng, divBox, 200,false,{
                            icon:'/publico/imagens/markers/coment.gif'
                        });
                        break;
                }
            });
        }
        $.Gmaps.calcularDistanciaRota(function (d) {
            $.Gmaps.recalcularMarcadoresDistancia(d);
        });
        $.Gmaps.centralizarMap();        
        $.Gmaps.atualizarEndereco();
        $.Gmaps.seguirRuas.status = true;
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
        if(!$.Gmaps.gMap)    
            $.Gmaps.gMap = new google.maps.Map(div, $.Gmaps.gMapOptions);
        
        //Adiciona o listner para o evento de click no mapa
        $.Gmaps.gEvent.addListener($.Gmaps.gMap, 'click', $.Gmaps.filtroEventClick);
        $.Gmaps.gEvent.addListener($.Gmaps.gMap, 'center_changed', $.Gmaps.atualizarEndereco);
                
        //Altera o status para navegando
        $.Gmaps.navegacao.alterar.navegando();
        return true;
    }
}

/**
 * Função inicial do plugin
 * @param opcoes
 */
$.fn.Gmaps = function (opcoes) {
    //Verifica se as opções tentam alterar os valores padrões de maps
    if(opcoes.gMapOptions)
        $.extend($.Gmaps.gMapOptions,opcoes.gMapOptions);
    
    //Verifica se as opções tentam alterar os valores padrões de maps
    if(opcoes.callbackTracarRotas)
        $.Gmaps.callbackTracarRotas = opcoes.callbackTracarRotas;
    
    //Verifica se as opções tentam alterar os valores padrões de maps
    if(opcoes.callbackAtualizarEndereco)
        $.Gmaps.callbackAtualizarEndereco = opcoes.callbackAtualizarEndereco;
    
    //Verifica se as opções tentam alterar os valores padrões de maps
    if(opcoes.callbackDistanciaRota)
        $.Gmaps.callbackDistanciaRota = opcoes.callbackDistanciaRota;
    
    //Percorre todos os elementos selecionados. Porem só cria um mapa
    return this.each(function () {
        //Atribui um Id a Div caso ela não possua um
        if(!this.id) this.id = 'GmapId';
                
        $.Gmaps.init(this);
    });
}

/* Stack-based Douglas Peucker line simplification routine 
   returned is a reduced GLatLng array 
   After code by  Dr. Gary J. Robinson,
   Environmental Systems Science Centre,
   University of Reading, Reading, UK
*/

function GDouglasPeucker (source, kink)
/* source[] Input coordinates in GLatLngs 	*/
/* kink	in metres, kinks above this depth kept  */
/* kink depth is the height of the triangle abc where a-b and b-c are two consecutive line segments */
{
    var	n_source, n_stack, n_dest, start, end, i, sig;    
    var dev_sqr, max_dev_sqr, band_sqr;
    var x12, y12, d12, x13, y13, d13, x23, y23, d23;
    var F = ((Math.PI / 180.0) * 0.5 );
    var index = new Array(); /* aray of indexes of source points to include in the reduced line */
    var sig_start = new Array(); /* indices of start & end of working section */
    var sig_end = new Array();	

    /* check for simple cases */

    if ( source.length < 3 ) 
        return(source);    /* one or two points */

    /* more complex case. initialize stack */
		
    n_source = source.length;
    band_sqr = kink * 360.0 / (2.0 * Math.PI * 6378137.0);	/* Now in degrees */
    band_sqr *= band_sqr;
    n_dest = 0;
    sig_start[0] = 0;
    sig_end[0] = n_source-1;
    n_stack = 1;

    /* while the stack is not empty  ... */
    while ( n_stack > 0 ){
    
        /* ... pop the top-most entries off the stacks */

        start = sig_start[n_stack-1];
        end = sig_end[n_stack-1];
        n_stack--;

        if ( (end - start) > 1 ){  /* any intermediate points ? */        
                    
            /* ... yes, so find most deviant intermediate point to
                       either side of line joining start & end points */                                   
            
            x12 = (source[end].lng() - source[start].lng());
            y12 = (source[end].lat() - source[start].lat());
            if (Math.abs(x12) > 180.0) 
                x12 = 360.0 - Math.abs(x12);
            x12 *= Math.cos(F * (source[end].lat() + source[start].lat()));/* use avg lat to reduce lng */
            d12 = (x12*x12) + (y12*y12);

            for ( i = start + 1, sig = start, max_dev_sqr = -1.0; i < end; i++ ){                                    

                x13 = (source[i].lng() - source[start].lng());
                y13 = (source[i].lat() - source[start].lat());
                if (Math.abs(x13) > 180.0) 
                    x13 = 360.0 - Math.abs(x13);
                x13 *= Math.cos (F * (source[i].lat() + source[start].lat()));
                d13 = (x13*x13) + (y13*y13);

                x23 = (source[i].lng() - source[end].lng());
                y23 = (source[i].lat() - source[end].lat());
                if (Math.abs(x23) > 180.0) 
                    x23 = 360.0 - Math.abs(x23);
                x23 *= Math.cos(F * (source[i].lat() + source[end].lat()));
                d23 = (x23*x23) + (y23*y23);
                                
                if ( d13 >= ( d12 + d23 ) )
                    dev_sqr = d23;
                else if ( d23 >= ( d12 + d13 ) )
                    dev_sqr = d13;
                else
                    dev_sqr = (x13 * y12 - y13 * x12) * (x13 * y12 - y13 * x12) / d12;// solve triangle

                if ( dev_sqr > max_dev_sqr  ){
                    sig = i;
                    max_dev_sqr = dev_sqr;
                }
            }

            if ( max_dev_sqr < band_sqr ){   /* is there a sig. intermediate point ? */
                /* ... no, so transfer current start point */
                index[n_dest] = start;
                n_dest++;
            }
            else{
                /* ... yes, so push two sub-sections on stack for further processing */
                n_stack++;
                sig_start[n_stack-1] = sig;
                sig_end[n_stack-1] = end;
                n_stack++;
                sig_start[n_stack-1] = start;
                sig_end[n_stack-1] = sig;
            }
        }
        else{
            /* ... no intermediate points, so transfer current start point */
            index[n_dest] = start;
            n_dest++;
        }
    }

    /* transfer last point */
    index[n_dest] = n_source-1;
    n_dest++;

    /* make return array */
    var r = new Array();
    for(var i=0; i < n_dest; i++)
        r.push(source[index[i]]);
    return r;
    
}