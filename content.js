var dbstructure = "CREATE TABLE Shows (id REAL UNIQUE, title TEXT, lastEpName TEXT, lastEpDate INTEGER, network TEXT)";

$.fn.reverse = [].reverse;

var SFdb = function () {
	this.db = null;
	this.init = function () {
		
		if (window.openDatabase) {
			db = window.openDatabase("showforecast_1", "1.0", "sqllite db for shows", 1024*1024);
			
			$.upddb = function (date,title,network,id) {
				db.transaction(function(tx) {
					tx.executeSql("UPDATE Shows SET lastEpName=?, lastEpDate=?,network=? WHERE id=?", [title,date,network,id],null,null)
				})
			}
			
			 db.transaction(function(tx) {
				tx.executeSql(dbstructure, [], null);
			});

		} else alert ('only dev version is supported');
	}

	this.settingsGetShowList = function () {
		$("#showlist").empty();
		db.transaction(function(tx) {
			tx.executeSql("SELECT id, title FROM Shows ORDER BY title ASC", [], function (tx,result){
				for (var i = 0; i < result.rows.length; ++i) {
					var show = result.rows.item(i);
					$("#showlist").append("<div class='showAC'><span onclick='$.watchhelper("+show['id']+")' class='watch' id='watche"+show['id']+"'>&nbsp;</span><span onclick='$.deletehelper("+show['id']+")' class='delete'>&nbsp</span>"+show['title']+"</div>");
				}
				$('#watche'+localStorage['watchid']).css('opacity','1');
			}, null)
		})
	}

	this.settingsAddShow = function (id,title) {
		db.transaction(function(tx) {
			tx.executeSql("INSERT INTO Shows (id, title) VALUES (?,?)", [id,title],null, 
				function () {alert('This show is already in your watch list')}
			)
		})
	}

	this.settingsDeleteShow = function (id) {
		db.transaction(function(tx) {
			tx.executeSql("DELETE FROM Shows WHERE id=?",[id],null,null)
		})
	}
	
	this.showPrevEpisodes = function (id) {
		$("#ser").hide();
		$("#episodes").show();	
		$("#episodes>#list").hide()
		$("#episodes>#loading_bar").show();
		$.get("http://services.tvrage.com/feeds/episode_list.php", {sid:id},
			function(data){
				$("#episodes>#loading_bar").hide();
				var show = $(data).find('Show');
				var contentlist = "";
				var showname = show.find('name').text();
				contentlist += "<b>Episodes list for "+showname+"</b>";
				show.find('Episodelist').find('Season').reverse().each(function(){
					contentlist += "<p>";
					var seasonnum = $(this).attr('no');
					var seriescount = $(this).find('episode').length;
					contentlist += "<b>Season "+seasonnum+"</b> ("+seriescount+" episodes)<br/>";
					$(this).find('episode').reverse().each(
						function () {
							var epnum = "";
							var epdate = $(this).find("airdate").text();
							if(seasonnum<10) epnum="S0"+seasonnum+"E"+$(this).find("seasonnum").text();
							else epnum="S"+seasonnum+"E"+$(this).find("seasonnum").text();
							
							contentlist += "<a target='_blank' href='"+$(this).find("link").text()+"' style='font-size:90%'>&nbsp;&nbsp;"+epdate+" "+epnum+" "+$(this).find("title").text()+"</a><br/>";
						}
					);
					
					contentlist += "</p>";
						
				});
				$("#episodes>#list").html(contentlist);
				$("#episodes>#list").show();
			}
		,'xml');
	}
	
	this.popupGetShows = function () {
		$("#ser").empty();
		db.transaction(function(tx) {
		
			var order='ASC';
			var today = new Date();
			if(localStorage['order']==2) {
				order='DESC';
			}
			
			tx.executeSql("SELECT * FROM Shows ORDER BY LastEpDate "+order, [], function (tx,result){
			
				if (result.rows.length ==0 ) {
					$('#ser').html('<div style="text-align:center; padding:30px;">No shows in your watch list. <br/><br/> Click <a target="_blank" href="options.html">here</a> and try to add some.</div>');
				
				};
				
				var showinvis = 1;
				for (var i = 0; i < result.rows.length; ++i) {
					var show = result.rows.item(i);
					var showdate,time = 0;
					if (show['lastEpDate']!=null && show['lastEpDate'] > today.getTime()) {
						var one_day = 1000*60*60*24;
						var daysleft = Math.ceil((show['lastEpDate'] - today.getTime())/one_day);
						if ((show['lastEpDate']-today.getTime()) < one_day) {
							time = new Date(show['lastEpDate']);
							showdate = "<div id='number'>"+time.toLocaleTimeString().substr(0,5)+"</div>today";
						}
						else if ((show['lastEpDate']-today.getTime()) < (one_day*2)) {
							time = new Date(show['lastEpDate']);
							showdate = "<div id='number'>"+time.toLocaleTimeString().substr(0,5)+"</div>tomorrow";
						}
						else showdate = "<div id='number'>"+daysleft+"</div>days";						
					} else {
						showdate = 'TBA';
					}
								
					var ep = '';
					
					if (show['lastEpName']!=null) ep='<br/><small><i>'+show['lastEpName']+'</small></i>'
					
					function datehelper (datestr) {
						
						var weekday=new Array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");
						var monthname=new Array("January","February","March","April","May","June","July","August","September","October","November","December")
						date = new Date (datestr);
						var returndate = weekday[date.getDay()]+', '+monthname[date.getMonth()]+' '+date.getDate();
					 return returndate;
					}
										
					var showp = "<div class='showp'>"
								+"<div style='float:left;'>"
								//+"<span class='title'><a target='blank' href='http://tvrage.com/shows/id-"+show['id']+"'>"+show['title']+"</a></span><br/>"
								+"<span class='title'><a title='Click and get previous`n`following episodes' target='blank' href='javascript:show_prev_episodes("+show['id']+");'>"+show['title']+"</a></span><br/>"
								if (showdate!='TBA') {showp = showp + "<span class='epname'>"+show['lastEpName']+"</span><br/>"};
								if (showdate!='TBA') {showp = showp + "<span class='epdate'>"+datehelper(show['lastEpDate']);
								if(show['network']!=null) showp = showp + ' on '+show['network'];
								showp = showp +	"</span>"};
								showp = showp + '</div>'+ "<div class='counter' style='float:right;'>";
								if (showdate=='TBA') showdate = '<abbr title="To Be Announced">TBA</abbr>';
								showp = showp + showdate + '</div></div>';
													
					
					$("#ser").append(showp);
					
				}
				
				if (localStorage['theme_colors'] != null) {
					var themecolors = localStorage['theme_colors'].split('|');
					$('body').css('background',themecolors[0]);
					$('*').css('color',themecolors[1]);
					$(".showp:nth-child(even)").css('background',themecolors[2]);
					$(".showp").css('border-color',themecolors[3]);
					
				} else { 
					$('*').css('color','123272');
					$(".showp:nth-child(even)").css('background','#ebeff9');
				}
				
				$(".showp:first").css('border','0px');
				
				
			}, null)
		})
	}
	
	this.backgroudCronJob = function () {
		db.transaction(function(tx) {
			tx.executeSql("SELECT id FROM Shows", [], function (tx,result){
				for (var i = 0; i < result.rows.length; ++i) {
					var show = result.rows.item(i);
					$.get("http://services.tvrage.com/feeds/full_show_info.php", {sid:show['id']},
					  function(data){
			  
						$.show = new Array ();
						$.show['current'] = $(data).find('Show');
						$.show['today'] = new Date();
						$.show['oneday'] = 1000*60*60*24;
						$.show['id'] = $.show['current'].find('showid').text();
						
						
						$.show['time'] = $.show['current'].find('airtime').text();
						$.show['network'] = $.show['current'].find('network').text();
						
						$.show['current'].find('Episodelist').find('Season:last').find('episode').each(function(){
							$.show['date'] = $(this).find('airdate').text();
							$.show['title'] = $(this).find('title').text();
							$.show['date_parsed']= new Date(Date.parse($.show['date']+' '+$.show['time']));
							
							if ($.show['date_parsed'].getTime() > $.show['today'].getTime()){								
								$.upddb($.show['date_parsed'].getTime(),$.show['title'],$.show['network'],$.show['id']);
								return false
							}
						
						});
						
						var today = new Date();
						
						if (localStorage['watchid'] == $.show['id']) {
							if ($.show['date_parsed'] != null && $.show['date_parsed'].getTime() > today.getTime()) {
								var one_day = 1000*60*60*24;
								var daysleft = Math.ceil(($.show['date_parsed'].getTime() - today.getTime())/one_day);
								
								if (($.show['date_parsed'].getTime()-today.getTime()) < one_day) {
									time = new Date($.show['date_parsed']);
									showdate = time.toLocaleTimeString().substr(0,5);
								}
								else if (($.show['date_parsed'].getTime()-today.getTime()) < (one_day*2)) {
									time = new Date($.show['date_parsed']);
									showdate = " 1 D";
								}
								else showdate = daysleft+" D";					
							} else showdate = 'TBA'
							details = new Object();
							details.text = showdate;
							chrome.browserAction.setBadgeText(details);
						}
					},'xml');
				}
			}, null)
		})
	}
}
