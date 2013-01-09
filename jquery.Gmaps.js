(function( $ ){
    
    var methods = {
        
    }
    
    var options = {
        /**
         * Opçoes do Objeto mapa 
         * google.maps.MapOptions
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
         * google.maps.PolylineOptions
         * https://developers.google.com/maps/documentation/javascript/reference?hl=#PolylineOptions
         */ 
        PolylineOptions: {
            strokeColor: "#4C4CFF",
            strokeOpacity: 0.6, 
            strokeWeight: 5,
            clickable:true
        }
    }
        
    $.fn.Gmaps = function(option,params) {
        
        //Trata @param option
        switch(typeof option) {
            case 'object':
                options = $.extend(options, option);
                break;
            case 'string':
                if(methods[option]) {
                //retorna o método
                } else if(options[option]) {
            
                    if(typeof options == typeof params) {
                
                        if(typeof options == 'object') {
                            options[option] = $.extend(options[option], params);
                        } else {
                            options[option] = params;
                        }
                    }
                }
                break;
                
        }
        
        //Verifica se foi informada alguma opção de alteração
        
        /**
         * Armazena o objeto Google Map
         * google.maps.Map
         * https://developers.google.com/maps/documentation/javascript/reference?hl=#Map
         */
        var Map = null;
        
        /**
         * Instancia do objeto Google Geocoder
         * google.maps.Geocoder
         * https://developers.google.com/maps/documentation/javascript/reference?hl=#Geocoder
         */
        var Geocoder = new google.maps.Geocoder();
        
        /**
         * Instancia do objeto Google Events
         * google.maps.event
         * https://developers.google.com/maps/documentation/javascript/reference?hl=#event
         */
        var MapEvent = google.maps.event;
        
        /**
         *Array para armazenar objetos google.maps.InfoWindow
         * https://developers.google.com/maps/documentation/javascript/reference#InfoWindow
         */
        var InfoWindows = new Array()
        
        /**
         * Array para armazenar objetos google.maps.Marker
         * https://developers.google.com/maps/documentation/javascript/reference#Marker
         */
        var Markers = new Array();
        
        /**
         * Armazena um objeto google.maps.Polyline
         * https://developers.google.com/maps/documentation/javascript/reference#Polyline
         */
        var Rota = null;
        
        /**
         * Função que percorre todos os elementos atigindos pelo seletor jquery.
         * O plugin só comporta um elemento para mapa
         * @param i Indice do elemento HTML selecionado
         * @param e Elemento HTML selecionado
         */
        this.each(function(i,e) {
            if(i == 0) {
                Map = new google.maps.Map(e,options['MapOptions']);
            } else {
                console.warn('O elemento '+i+' não pode ser carregado como mapa');
            }
        });
    };
})( jQuery );