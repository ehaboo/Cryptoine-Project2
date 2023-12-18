/// <reference path="jquery-3.7.0.js" />



$(() => {

    loadAllCoins(); 



    
    $(window).on("keydown", function(event){
        if(event.keyCode === 13) {
        event.preventDefault();
        return ;
        }
    });
     

    let globalCoinsMoreInfoArr = new Map();
    let intervalId; 
    let selectedCoins = []; 


    $(".nav-link").on("click", function () {
        $(".nav-link").removeClass("active");
        $(this).addClass("active");

        $(".cry-page").removeClass("active");
        const page = $(this).data("page");
        $(page).addClass("active");

        $("#searchValue").css("border", "var(--bs-border-width) solid var(--bs-border-color)"); 
        $("#searchValue").attr("placeholder", "Search"); 

        if (page !== "#liveReports"){
            clearInterval(intervalId);
        }
    });




    async function loadAllCoins(){
        try{
            const coins = await getJson("https://api.coingecko.com/api/v3/coins/markets?order=market_cap_desc&vs_currency=usd");
            console.log(coins);
            displayCoins( coins );
        }
        catch( err ){
        swal("Oooops!!", err.message);
        }
    }  




    $(".btn.btn-outline-success").on("click", loadFoundedCoins);


    async function loadFoundedCoins() {

        selectedCoins.length = 0 ; 
        $("input.liveChecks").prop("checked", false); 
        $(".nav-link[data-page='#liveReports']").addClass("disabled");

        const searchValue = $("#searchValue").val();

        if (!searchValue) {
            $("#searchValue").css("border", "3px solid red"); 
            $("#searchValue").attr("placeholder", "Write Something...."); 
            return; 
        }

        $("div.cry-page").removeClass("active");
        $("a.nav-link").removeClass("active"); 
        $("li:first-of-type > a.nav-link").addClass("active"); 
        $("#coins").addClass("active"); 

        $("#searchValue").css("border", "var(--bs-border-width) solid var(--bs-border-color)"); 
        $("#searchValue").attr("placeholder", "Search"); 


        try {
            const coinsObj = await getJson(`https://api.coingecko.com/api/v3/search?query=${searchValue}`);
            const coins = coinsObj.coins;      
            displayCoins(coins);
        } catch (err) {
            swal("Oooops!!", err.message);
        }

        $("#searchValue").val("");
    }


    function displayCoins(coins) {
        let count = 0 ;
        let coinsContent = "";

        for (const coin of coins) {
        coinsContent += getCoinHtml(coin);
        count++; 
        }

        $("#countBox").html(`There Are ${count} Coins Founded. <br/>`);
        $("#coinsBox").html(coinsContent);
    }


    function getCoinHtml(coin) {
        return `
            <div class="col">
                <div class="card shadowMe p-3 mb-5 bg-body rounded">
                    <div class="card-body parentCard">
                        <div id="cardTitle"> 
                            <h5 class="card-title">${coin.symbol.toUpperCase()}</h5>
                            <div>
                                <input class="form-check-input liveChecks" id="${coin.id}" type="checkbox" role="switch" data-livesymbol="${coin.symbol}" data-liveid="${coin.id}">
                                <label>Live Reports</label>
                            </div>
                        </div>
                        <p class="card-text">${coin.name}</p>
                        <p class="d-inline-flex gap-1">
                            <button class="btn btn-primary moreInfo" data-coinid="${coin.id}" type="button" data-bs-toggle="collapse" data-bs-target="#co${coin.id}" aria-expanded="false" aria-controls="collapseExample">
                                More Info
                            </button>
                        </p>
                        <div class="collapse shadowUs" id="co${coin.id}">
                            <span class="loader moreInfoLoader"></span>
                        </div>  
                    </div>
                </div>
            </div>
        `;
    }




    $("main").on("click", "button.moreInfo", coinMoreInfo );
  

    async function coinMoreInfo(){

        const coinId = $(this).data("coinid");

        if (globalCoinsMoreInfoArr.has(coinId)) {
            const coinInfoObjGlobal = globalCoinsMoreInfoArr.get(coinId);
            const now = Date.now();

            if( ( now - coinInfoObjGlobal.timestamp ) < (1000 * 120 ) ){
                displayCoinInfo(coinInfoObjGlobal);
                return; 
            }
        }

        try{
            const coinInfoObj = await getJson(`https://api.coingecko.com/api/v3/coins/${coinId}`);
            displayCoinInfo(coinInfoObj);

            coinInfoObj.timestamp = Date.now(); 
            globalCoinsMoreInfoArr.set(coinId, coinInfoObj);
        }
        catch( err ){
            swal("Oooops!!", err.message);
        }
    }

    function displayCoinInfo(coinInfoObj) {

        const dataMarket = coinInfoObj.market_data;
        const currentPrice = dataMarket.current_price; 


        let coinInfoContent = `
            <div class="card card-body childCard">
                <img src="${coinInfoObj.image.thumb}" alt="coin-Image" width="30">
                <p>USD: ${currentPrice.usd}$</p>
                <p>EUR: ${currentPrice.eur}&#8364;</p>
                <p>ILS: ${currentPrice.ils}&#8362;</p>
            </div>
        `;

        const parents = $(`button[data-coinid=${coinInfoObj.id}]`).parent();
        const moreInfoBox = parents.next();
        moreInfoBox.html(coinInfoContent);
    }




    $("main").on("change", "input.liveChecks", coinsChecked); 

    let lastOne; 

        function coinsChecked(){

            if ($(this).is(":checked")) {
                selectedCoins.push($(this)); 
            }else{
                const index = selectedCoins.findIndex(obj => $(this).attr("id") === obj.attr("id"));
                selectedCoins.splice(index, 1);
            }

            selectedCoins.length > 0 ? $(".nav-link[data-page='#liveReports']").removeClass("disabled") : $(".nav-link[data-page='#liveReports']").addClass("disabled");

            if (selectedCoins.length > 5) {

                $('#modalCoins').empty();

                let modalListContent = ""; 

                selectedCoins.forEach(function(selectedCoin) {
                    let index = selectedCoins.indexOf(selectedCoin);

                    if (index < 5) {
                        selectedCoin = selectedCoin[0];
                        const coinId = $(selectedCoin).attr("data-liveid");
                        const coinSymbol = $(selectedCoin).attr("data-livesymbol");

                        modalListContent += `
                            <li class="form-check modalInputs" id=${coinId}>
                                <input class="form-check-input modalChecks" checked="true" data-index="${index}" type="checkbox" name="modalChecks" id="${coinId}" data-modalsymbol="${coinSymbol}" data-modalid="${coinId}">
                                <label class="form-check-label">
                                ${coinSymbol.toUpperCase()}
                                </label>
                            </li>
                        `;
                    }else{
                        lastOne = selectedCoin; 
                    }
                });

                lastOne = lastOne[0];
                const lastOneSymbol = $(lastOne).attr("data-livesymbol");

                $("#listModal").modal({
                backdrop: "static",
                keyboard: false
                });

                $("#coinToSwap").html(lastOneSymbol.toUpperCase()); 
                $('#modalCoins').append(modalListContent);
                $("#listModal").modal("show");
            }
        }




    $("main").on("click", ".modalBtn", uncheckLastCoin); 

        function uncheckLastCoin() {

            $("div.modal-body").html("");

            const lastOneId = $(lastOne).attr("data-liveid");

            $(`input[data-liveid='${lastOneId}']`).prop( "checked", false );

            selectedCoins.splice(5, 1);

        }




    $('#modalCoins').on('change', '.modalChecks', function() {

        const uncheckedCoin = $('.modalChecks:not(:checked)');
        const uncheckedCoinid = uncheckedCoin.data("modalid"); 

        $(`.liveChecks[data-liveid=${uncheckedCoinid}]`).prop( "checked", false);

        const uncheckedCoinIndex = uncheckedCoin.data("index");
        selectedCoins.splice(uncheckedCoinIndex,1)

        $("#listModal").modal("hide");

    });




    function coinsRepoVal(){ 
        let coinsLabel = []; 
        let coinsToRepo = ""; 

        selectedCoins.forEach( selectedCoin => {
            selectedCoin = selectedCoin[0];
            const coinSymbol = $(selectedCoin).attr("data-livesymbol");
            coinsToRepo += coinSymbol + ","; 
            coinsLabel.push(coinSymbol.toUpperCase());
        }); 

        return {coinsToRepo, coinsLabel}; 
    }


    $(".nav-link[data-page='#liveReports']").on("click", function () {

        $("#myChart").empty(); 
        $("#liveReports").html(`<canvas id="myChart"></canvas>`);

        async function currentPrice() {

            const coinsToRepo = coinsRepoVal().coinsToRepo; 

            let liveRepoObj = await getJson(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coinsToRepo}&tsyms=USD`);
            const currentTime = Date.now(); 

            const liveRepoObjsArr = []
            const coinsCurrentPrice = [];
            
            liveRepoObjsArr.push(liveRepoObj); 

            for (const coin of liveRepoObjsArr) {
                for (const price in coin) {
                    coinsCurrentPrice.push(coin[price].USD);
                }
            }
            getChartLines(coinsCurrentPrice);

        }


        let dataPoints = [];

        const data = {
            datasets: []

        }     
        

        const config = {
            data,
            options: {
                transitions: {
                    show: {
                        animations: {
                            x: {
                                from: 0
                            },
                            y: {
                                from: 0
                            }
                        }
                    },
                    hide: {
                        animations: {
                            x: {
                                to: 0
                            },
                            y: {
                                to: 0
                            }
                        }
                    }
                },
                plugins:{
                    title:{
                        display: true,
                        text: "Coins Live Reports", 
                        font: {
                            size: 28
                        }
                    },
                    streaming:{
                        duration:20000, 
                        ttl:60000,
                        refresh: 2000, 
                    }
                },
                interaction:{
                    intersect: false
                }, 
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Chart Updates every 2 secs',
                            font: {
                                size: 20
                            }
                        },
                        type: 'realtime', 
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Current Price in USD',
                            font: {
                                size: 20
                            }
                        },
                        beginAtZero: true
                    }
                }
            }
        };


        const ourChart = new Chart($("#myChart"), config ); 
    

        let count = 0; 
        let datasetsDataArr = {a0:[],a1:[],a2:[],a3:[],a4:[]};  
        const colors =  ['Red', 'Blue', 'Yellow', 'Green', 'Orange'];
        const coinsLabel = coinsRepoVal().coinsLabel; 

       
        for (let i=0; i < coinsLabel.length ; i++) {
            const coinLine = {
                type: 'line',
                label: coinsLabel[i], 
                data: datasetsDataArr[`a`+i],
                backgroundColor: colors[i],
                borderColor: colors[ 4 - i ],
                borderWidth: 1
            }
            data.datasets.push(coinLine);
            ourChart.update();

        }

        function getChartLines(coinsCurrentPrice) {
            
            for (let j = 0 ; j < coinsCurrentPrice.length; j++) {
                
                dataPoints[j] ={ x: Date.now(), y: coinsCurrentPrice[j]};

                
                datasetsDataArr[`a`+j].push(dataPoints[j]);
                count++;
            }
            ourChart.update();
        }
        
        
        intervalId = setInterval( function () {
                
            currentPrice(); 

        }, 2000);

    });




    function getJson(url) {
      return new Promise((resolve, reject) => {
            $.ajax({
                url,
                success: (data) => resolve(data),
                error: (err) => reject(err.statusText),
            });
        });
    }

});
