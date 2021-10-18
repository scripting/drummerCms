var myVersion = "0.7.0";

const rightCaret = "fa fa-caret-right darkCaretColor", downCaret = "fa fa-caret-down lightCaretColor";
var urlTwitterServer = "http://electricserver.scripting.com/";

///tabs -- 9/2/21 by DW
	var tabs = [
		{
			enabled: function () {
				return (true);
				},
			active: true,
			id: "blog",
			title: "Blog",
			icon: "book",
			viewer: viewBlogTab
			},
		{
			enabled: function () {
				return (opmlHead.urlLinkblogJson !== undefined);
				},
			active: false,
			id: "links",
			title: "Links",
			icon: "link",
			viewer: viewLinkblogTab
			},
		{
			enabled: function () {
				return (opmlHead.urlAboutOpml !== undefined);
				},
			active: false,
			id: "about",
			title: "About",
			icon: "info-circle",
			viewer: viewAboutTab
			}
		];
	
	function setTabContent (htmltext) {
		$("#idTabContent").html (htmltext);
		}
	function readGlossary (urlGlossary, callback) { //9/10/21 by DW
		var theGlossary = new Object (), whenstart = new Date ();
		if (urlGlossary === undefined) {
			callback (theGlossary);
			}
		else {
			readHttpFileThruProxy (urlGlossary, undefined, function (opmltext) {
				if (opmltext !== undefined) {
					var theOutline = opml.parse (opmltext);
					theOutline.opml.body.subs.forEach (function (item) {
						theGlossary [item.text] = item.subs [0].text;
						});
					console.log ("readGlossary: " + secondsSince (whenstart) + " secs.");
					}
				callback (theGlossary);
				});
			}
		}
	function viewBlogTab (callback) { //nothing to do, the content is already there
		callback (true);
		}
	function viewLinkblogTab (callback) {
		setTabContent (""); //wipe out the blog html before user sees it
		if (opmlHead.urlLinkblogJson === undefined) {
			callback (false);
			}
		else {
			var urlHtmltext = stringPopExtension (opmlHead.urlLinkblogJson) + ".html";
			readHttpFile (urlHtmltext, function (htmltext) {
				if (htmltext === undefined) {
					callback (false);
					}
				else {
					setTabContent (htmltext);
					callback (true);
					}
				});
			}
		}
	function viewAboutTab (callback) {
		
		function processOutlineStruct (theOutline) {
			var outlineBody = theOutline.opml.body;
			var htmltext = renderOutlineBrowser (outlineBody, false, undefined, undefined, true);
			
			readGlossary (opmlHead.urlGlossary, function (theGlossary) {
				htmltext = multipleReplaceAll (htmltext, theGlossary);
				htmltext = safeEmojiProcess (htmltext);
				setTabContent (htmltext);
				callback (true);
				});
			}
		
		function safeEmojiProcess (s) {
			try {
				return (emojiProcess (s));
				}
			catch (err) {
				return (s);
				}
			}
		setTabContent (""); //wipe out the blog html before user sees it
		
		if (aboutOutline !== undefined) { //10/18/21 by DW
			console.log ("viewAboutTab: using the pre-built aboutOutline.");
			processOutlineStruct (aboutOutline)
			}
		else {
			readHttpFileThruProxy (opmlHead.urlAboutOpml, undefined, function (opmltext) {
				if (opmltext !== undefined) {
					var theOutline = opml.parse (opmltext);
					processOutlineStruct (theOutline);
					}
				else {
					callback (false);
					}
				});
			}
		}
	
	function startTabsIfHomePage (activeTabName, callback) { 
		if (config.flHomePage) {
			activeTabName = (activeTabName === undefined) ? tabs [0].id : activeTabName;
			tabs.forEach (function (item) {
				if (item.enabled ()) {
					var theTabListItem = $("<li></li>");
					
					if (item.id == activeTabName) {
						$(theTabListItem).addClass ("active");
						if (item.viewer !== undefined) {
							item.viewer (function (fl) {
								});
							}
						}
					
					var theAnchor = $("<a data-toggle=\"tab\"></a>");
					var theIcon = $("<i class=\"iTabIcon fa fa-" + item.icon + "\"></i>");
					var theTitle = $("<span class=\"spTabItemTitle\">" + item.title + "</span>");
					
					theAnchor.append (theIcon);
					theAnchor.append (theTitle);
					theTabListItem.append (theAnchor);
					
					$(theTabListItem).click (function (event) {
						window.location.href = "?tab=" + item.id;
						event.stopPropagation ();
						event.preventDefault ();
						});
					
					$("#idTabList").append (theTabListItem);
					}
				});
			$("#idTabsPage").css ("display", "block")
			callback ();
			}
		else {
			$("#idTabsPage").css ("display", "block")
			callback ();
			}
		}
//like -- 11/8/18 by DW
	const urlLikeServer = "http://likes.scripting.com/";
	
	function ifConnected (confirmationPrompt, callback) { //12/15/18 by DW
		twStorageData.urlTwitterServer = urlLikeServer;
		if (twIsTwitterConnected ()) {
			callback ();
			}
		else {
			confirmDialog (confirmationPrompt, function () {
				twConnectToTwitter ();
				});
			}
		}
	function serverCall (verb, params, callback, server, method, data) {
		const timeoutInMilliseconds = 30000;
		if (method === undefined) {
			method = "GET";
			}
		if (params === undefined) {
			params = new Object ();
			}
		if (params.accessToken === undefined) { //10/29/18 by DW
			if (localStorage.twOauthToken !== undefined) {
				params.accessToken = localStorage.twOauthToken;
				}
			}
		if (server === undefined) { //9/25/18 by DW
			server = urlLikeServer;
			}
		var apiUrl = server + verb;
		var paramString = buildParamList (params);
		if (paramString.length > 0) {
			apiUrl += "?" + paramString;
			}
		var ajaxResult = $.ajax ({ 
			url: apiUrl,
			type: method,
			data: data,
			dataType: "text", 
			headers: undefined,
			timeout: timeoutInMilliseconds 
			}) 
		.success (function (data, status) { 
			callback (undefined, data);
			}) 
		.error (function (status) { 
			console.log ("serverCall: url == " + apiUrl + ", error == " + jsonStringify (status));
			callback ({message: "Error reading the file."});
			});
		}
	function likeClick (idLikes, urlForLike) {
		ifConnected ("Sign on to Twitter to enable Like/Unlike?", function () {
			var params = {
				oauth_token: localStorage.twOauthToken,
				oauth_token_secret: localStorage.twOauthTokenSecret,
				url: urlForLike
				};
			console.log ("likeClick:");
			$("#" + idLikes).blur ();
			serverCall ("toggle", params, function (err, jsontext) {
				if (err) {
					console.log ("likeClick: err == " + jsonStringify (err));
					}
				else {
					var jstruct = JSON.parse (jsontext);
					console.log ("likeClick: jstruct == " + jsonStringify (jstruct));
					viewLikes (idLikes, urlForLike, jstruct.likes);
					}
				});
			});
		}
	function getLikes (url, callback) {
		var params = {
			url: url
			};
		serverCall ("likes", params, function (err, jsontext) {
			if (err) {
				console.log ("getLikes: err == " + jsonStringify (err));
				callback (err);
				}
			else {
				var jstruct = JSON.parse (jsontext);
				callback (undefined, jstruct);
				}
			});
		}
	function getLikesArray (theArray, callback) { //2/7/20 by DW
		var params = {
			jsontext: jsonStringify (theArray)
			};
		serverCall ("getlikesarray", params, function (err, jsontext) {
			if (err) {
				console.log ("getLikesArray: err == " + jsonStringify (err));
				callback (err);
				}
			else {
				var jstruct = JSON.parse (jsontext);
				callback (undefined, jstruct);
				}
			});
		}
	function viewLikes (idLikes, myUrl, likes) { 
		function getThumbIcon (thumbDirection, flopen) {
			var open = "";
			if (flopen) {
				open = "o-";
				}
			return ("<span class=\"spThumb\"><i class=\"fa fa-thumbs-" + open + thumbDirection + "\"></i></span>&nbsp;");
			}
		var likesObject = $("#" + idLikes);
		var ct = 0, likenames = "", thumbDirection = "up", flOpenThumb = true, myScreenname = twGetScreenName ();
		if (likes !== undefined) {
			likes.forEach (function (name) {
				ct++;
				likenames += name + ", ";
				if (name == myScreenname) {
					thumbDirection = "down";
					flOpenThumb = false;
					}
				});
			}
		var theThumb = getThumbIcon ("up", flOpenThumb);
		
		var ctLikes = ct; //11/22/18 by DW
		
		if (ct > 0) {
			likenames = stringMid (likenames, 1, likenames.length - 2); //pop off comma and blank at end
			ctLikes = "<span rel=\"tooltip\" title=\"" + likenames + "\">" + ctLikes + "</span>";
			}
		var htmltext = "<span class=\"spLikes\"><a onclick=\"likeClick ('" + idLikes + "', '" + myUrl + "')\">" + theThumb + "</a>" + ctLikes + "</span>";
		likesObject.html (htmltext);
		$("[rel=\"tooltip\"]").tooltip ();
		}
	function getPostPermalink (theItem) { //12/15/18 by DW
		var href = undefined;
		if (theItem.className == "divTitledItem") {
			if (config.flHomePage) {
				$(theItem).children (".divTitle").each (function () {
					$(this).children ("a").each (function () {
						var myhref = $(this).attr ("href");
						if (myhref !== undefined) {
							href = myhref;
							}
						});
					});
				}
			else {
				href = window.location.href;
				}
			}
		else {
			$(theItem).children (".spPermaLink").each (function () {
				$(this).children ("a").each (function () {
					href = $(this).attr ("href");
					});
				});
			}
		return (href);
		}
	function getPostText (theItem) { //used in prompts, for example -- 12/16/18 by DW
		var theClass = $(theItem).attr ("class"), theText;
		switch (theClass) {
			case "divSingularItem":
				theText = $(theItem).text ();
				break;
			case "divTitledItem":
				$(theItem).children (".divTitle").each (function () {
					$(this).children ("a").each (function () {
						var myhref = $(this).attr ("href");
						if (myhref !== undefined) {
							theText = $(this).text ();
							}
						});
					});
				break;
			}
		return (theText);
		}
//twitter comments -- 12/14/18 by DW
	const tweetCommentHashtag = "#scriptingnews";
	const ctUrlInTweetChars = 23;
	
	function startTweetDialog (thePrompt, callback) {
		var tweetEditorOptions = {
			ctHashTagChars: tweetCommentHashtag.length + 1 + ctUrlInTweetChars + 1, 
			prompt: thePrompt,
			placeholderText: "This text will appear in the body of your tweet.",
			savedTweetText: "",
			flCustomHtml: false,
			flCancelButton: true
			}
		startTweetEditor ("idMyTweetEditor", tweetEditorOptions, callback);
		$("#idTweetDialog").modal ("show");
		}
	function closeTweetDialog () {
		$("#idTweetDialog").modal ("hide");
		}
	function addItemToFeed (params, callback) {
		params.oauth_token = localStorage.twOauthToken;
		params.oauth_token_secret = localStorage.twOauthTokenSecret;
		serverCall ("addtofeed", params, function (err, jsontext) {
			if (err) {
				console.log ("addItemToFeed: err == " + jsonStringify (err));
				if (callback !== undefined) {
					callback (err);
					}
				}
			else {
				var jstruct = JSON.parse (jsontext);
				if (callback !== undefined) {
					callback (undefined, jstruct);
					}
				}
			});
		}
	function postTweetComment (editedText, urlPermalink) {
		var tweetText = editedText + " " + tweetCommentHashtag + " " + urlPermalink;
		console.log ("postTweetComment: tweetText == " + tweetText);
		twStorageData.urlTwitterServer = urlLikeServer;
		twTweet (tweetText, "", function (data) {
			closeTweetDialog ();
			var urlTweet = "https://twitter.com/" + twGetScreenName () + "/status/" + data.id_str;
			window.open (urlTweet);
			var item = {
				link: urlTweet, 
				text: editedText,
				category: tweetCommentHashtag,
				permalink: urlTweet 
				};
			addItemToFeed (item, function (err, data) {
				console.log (jsonStringify (data));
				});
			});
		}
	function setupTwitterComments () {
		const shareIcon = "<i class=\"fa fa-retweet\"></i>";
		const maxTextLengthForPrompt = 50;
		$(".divTitledItem, .divSingularItem").each (function () {
			var flCommentSetup = getBoolean ($(this).data ("commentsetup")); //10/17/19 by DW
			if (!flCommentSetup) { //10/17/19 by DW
				var urlPermalink = getPostPermalink (this); 
				var theText = getPostText (this);
				var theIcon = "<a title=\"Click here to RT in Twitter.\">" + shareIcon + "</a>";
				var htmltext = "<span class=\"spTwitterComment\">" + theIcon + "</span>";
				var theObject = $(htmltext);
				$(theObject).click (function () {
					ifConnected ("Sign on to Twitter to enable comments?", function () {
						var thePrompt = "RT: " + maxLengthString (theText, maxTextLengthForPrompt);
						startTweetDialog (thePrompt, function (tweetText) {
							if (tweetText === undefined) { //user clicked Cancel
								closeTweetDialog ();
								}
							else {
								postTweetComment (tweetText, urlPermalink);
								}
							});
						});
					});
				$(this).append (theObject);
				$(this).attr ("data-commentsetup", true); //indicate that we've been here -- 10/17/19 by DW
				}
			});
		}
//how long running -- 8/9/19 by DW
	function howLongSinceStartAsString (whenStart) {
		var x = howLongSinceStart (whenStart);
		function getnum (num, units) {
			if (num != 1) {
				units += "s";
				}
			return (num + " " + units);
			}
		return (getnum (x.years, "year") + ", " + getnum (x.months, "month") + ", " + getnum (x.days, "day") + ", " + getnum (x.hours, "hour") + ", " + getnum (x.minutes, "minute") + ", " + getnum (x.seconds, "second") + ".");
		}
//infinite scrolling -- 10/17/19 by DW
	var whenLastMoreButtonClick = new Date (0);
	var currentOldestPageDate = undefined;
	
	function moreButtonClick () {
		if (currentOldestPageDate === undefined) {
			currentOldestPageDate = config.oldestDayOnHomePage;
			}
		var day = dateYesterday (currentOldestPageDate);
		var url = "http://montana.scripting.com:1400/day?blog=dave&day=" + day.toUTCString ();
		currentOldestPageDate = day;
		readHttpFileThruProxy (url, undefined, function (htmltext) {
			if (htmltext !== undefined) {
				$("#idTabContent").append ("<div class=\"divArchivePageDay\">" + htmltext + "</div>")
				setupJavaScriptFeatures ();
				}
			});
		}
	function infiniteScrollHandler () {
		}
function toggleTwitterConnect () {
	twStorageData.urlTwitterServer = urlLikeServer; //8/21/19 by DW
	twToggleConnectCommand ();
	updateTwitterButton ();
	}
function updateTwitterButton () {
	var buttontext = twStorageConsts.fontAwesomeIcon + " Sign " + ((twIsTwitterConnected ()) ? "off" : "on");
	$("#idToggleConnect").html (buttontext);
	}
function initWedge (domObject, clickCallback) { //the caret goes to the left of the object -- 7/24/17 by DW
	var theIcon = $("<i class=\"" + rightCaret + "\"></i>");
	var theWedge = $("<span class=\"spScriptingNewsWedge\"></span>");
	$(theWedge).append (theIcon);
	$(domObject).prepend (theWedge);
	theWedge.click (function () {
		var className = $(theIcon).attr ("class");
		if (className == rightCaret) {
			clickCallback (true); //expand
			$(theIcon).attr ("class", downCaret);
			}
		else {
			clickCallback (false); //collapse
			$(theIcon).attr ("class", rightCaret);
			}
		});
	return (theWedge);
	}
function setupExpandableType (attname, htmlTemplate) {
	function fixYoutubeUrl (url) { //3/18/18; by DW
		const prefix = "https://www.youtube.com/watch?v=";
		if (beginsWith (url, prefix)) {
			url = "https://www.youtube.com/embed/" + stringDelete (url, 1, prefix.length);
			}
		return (url);
		}
	$(".divPageBody li, .divSingularItem").each (function () {
		var parentOfTweet = this, theObject = undefined;
		var theText = $(this).text ();
		var attval = $(this).data (attname.toLowerCase ());
		if (attval !== undefined) {
			if (attname == "urlvideo") { //3/18/18; by DW
				attval = fixYoutubeUrl (attval);
				}
			initWedge (parentOfTweet, function (flExpand) {
				function exposetheObject () {
					$(theObject).slideDown (0, 0, function () {
						$(theObject).css ("visibility", "visible");
						});
					}
				if (flExpand) {
					if (theObject === undefined) {
						let htmltext = replaceAll (htmlTemplate, "[%attval%]", attval);
						theObject = $(htmltext);
						$(parentOfTweet).append (theObject);
						exposetheObject ();
						}
					else {
						exposetheObject ();
						}
					}
				else {
					$(theObject).slideUp (0, 0, function () {
						});
					}
				});
			}
		});
	}
function setupExpandableImages () {
	setupExpandableType ("urlexpandableimage", "<img class=\"imgExpandable\" src=\"[%attval%]\">");
	}
function setupExpandableVideo () {
	setupExpandableType ("urlvideo", "<iframe width=\"560\" height=\"315\" src=\"[%attval%]\" frameborder=\"0\" allowfullscreen></iframe>");
	}
function setupExpandableDisqusThreads () {
	const myDisqusGroup = "scripting";
	
	function getDisqusCommentsText (thispageurl, disqusGroup) {
		var s = "";
		if (disqusGroup === undefined) {
			disqusGroup = myDisqusGroup;
			}
		if (thispageurl === undefined) {
			thispageurl = window.location.href;
			}
		var disqusTextArray = [
			"\n<div class=\"divDisqusComments\">\n",
				"\t<div id=\"disqus_thread\"></div>\n",
				"\t<script>\n",
					"\t\tvar disqus_config = function () {\n",
						"\t\t\tthis.page.url = \"" + thispageurl + "\"; \n",
						"\t\t\t};\n",
					"\t\t(function () {  \n",
						"\t\t\tvar d = document, s = d.createElement ('script');\n",
						"\t\t\ts.src = '//" + disqusGroup + ".disqus.com/embed.js';  \n",
						"\t\t\ts.setAttribute ('data-timestamp', +new Date());\n",
						"\t\t\t(d.head || d.body).appendChild(s);\n",
						"\t\t\t})();\n",
					"\t\t</script>\n",
				"\t</div>\n"
			];
		for (var i = 0; i < disqusTextArray.length; i++) {
			s += disqusTextArray [i];
			}
		console.log ("getDisqusCommentsText: " + s);
		
		return (s)
		}
	
	function startDisqus (disqusGroup) {
		(function() {
			var dsq = document.createElement ('script'); dsq.type = 'text/javascript'; dsq.async = true;
			dsq.src = '//' + disqusGroup + '.disqus.com/embed.js';
			$("body").appendChild (dsq);
			})();
		}
		
	setupExpandableType ("flExpandableDisqusThread", "<div class=\"divDisqusThread\"><div id=\"disqus_thread\"></div></div>");
	startDisqus (myDisqusGroup);
	}
function setupTweets () {
	function getEmbedCode (id, callback) {
		var url = "http://twitterembed.scripting.com/getembedcode?id=" + encodeURIComponent (id);
		$.ajax ({
			type: "GET",
			url: url,
			success: function (data) {
				callback (data);
				},
			error: function (status) { 
				console.log ("getEmbedCode: error == " + JSON.stringify (status, undefined, 4));
				callback (undefined); 
				},
			dataType: "json"
			});
		}
	function viewTweet (idTweet, idDiv, callback) { //12/22/19 by DW
		var idViewer = "#" + idDiv, now = new Date ();
		if (idTweet == undefined) {
			$(idViewer).html ("");
			}
		else {
			getEmbedCode (idTweet, function (struct) {
				$(idViewer).css ("visibility", "hidden");
				$(idViewer).html (struct.html);
				if (callback != undefined) {
					callback (struct);
					}
				});
			}
		$(idViewer).on ("load", function () {
			$(idViewer).css ("visibility", "visible");
			});
		}
	$(".divPageBody li, .divSingularItem").each (function () {
		var parentOfTweet = this, tweetObject = undefined;
		var theText = $(this).text ();
		var urlTweet = $(this).data ("urltweet");
		
		var tweetId = $(this).data ("tweetid"), tweetUserName = $(this).data ("tweetusername"); //11/16/17 by DW
		if ((tweetId !== undefined) && (tweetUserName !== undefined) && (urlTweet === undefined)) {
			urlTweet = "https://twitter.com/" + tweetUserName + "/status/" + tweetId;
			}
		
		if (urlTweet !== undefined) {
			let idTweet = stringLastField (urlTweet, "/");
			initWedge (parentOfTweet, function (flExpand) {
				$(this).blur (); //12/22/19 by DW
				function exposeTweetObject () {
					$(tweetObject).slideDown (75, undefined, function () {
						$(tweetObject).on ("load", function () {
							$(tweetObject).css ("visibility", "visible");
							});
						});
					}
				if (flExpand) {
					if (tweetObject === undefined) {
						let tweetObjectId = "tweet" + idTweet;
						let htmltext = "<div class=\"divEmbeddedTweet\" id=\"" + tweetObjectId + "\"></div>";
						tweetObject = $(htmltext);
						$(parentOfTweet).append (tweetObject);
						if (twStorageData.urlTwitterServer === undefined) { //11/15/18 by DW
							console.log ("setupTweets: twStorageData.urlTwitterServer == undefined");
							twStorageData.urlTwitterServer = urlLikeServer; //whack the bug -- 11/23/18 by DW
							}
						viewTweet (idTweet, tweetObjectId, function () {
							exposeTweetObject ();
							});
						}
					else {
						exposeTweetObject ();
						}
					}
				else {
					$(tweetObject).slideUp (75);
					}
				});
			}
		});
	}
function setupExpandableOutline () {
	$(".divPageBody li").each (function () {
		var ul = $(this).next ();
		var parentOfTweet = this, tweetObject = undefined;
		var theText = $(this).text ();
		var collapse = $(this).data ("collapse");
		if (getBoolean (collapse)) {
			initWedge (this, function (flExpand) {
				if (flExpand) {
					$(ul).slideDown (75, undefined, function () {
						$(ul).css ("display", "block");
						});
					}
				else {
					$(ul).slideUp (75);
					}
				});
			}
		});
	}
function setupXrefs () {
	$(".divPageBody li, .divSingularItem").each (function () {
		var theText = $(this).text ();
		var xref = $(this).data ("xref");
		if (xref !== undefined) {
			var theListItem = this, outlineObject = undefined;
			var fname, folder, url;
			if (stringContains (xref, "#")) {
				fname = "a" + stringDelete (stringNthField (xref, "#", 2), 1, 1) + ".json"
				folder = replaceAll (stringNthField (xref, "#", 1),  ".html", "");
				}
			else { //handle xrefs that point to story pages -- 7/13/18 by DW
				fname = "a" + stringPopExtension (stringLastField (xref, "/")) + ".json";
				folder = stringPopLastField (xref, "/");
				}
			url = replaceAll (folder, "scripting.com/", "scripting.com/data/items/") + "/" + fname; //2/6/20 by DW
			
			console.log ("setupXrefs: url == " + url);
			
			initWedge (theListItem, function (flExpand) {
				if (flExpand) {
					function exposeOutlineObject () {
						$(outlineObject).slideDown (75, undefined, function () {
							$(outlineObject).css ("display", "block");
							
							});
						}
					if (outlineObject === undefined) {
						readHttpFile (url, function (jsontext) {
							if (jsontext !== undefined) {
								var jstruct = JSON.parse (jsontext), permalinkString = "", htmltext;
								
								if (jstruct.created !== undefined) {
									permalinkString = "<div class=\"divXrefPermalink\"><a href=\"" + xref + "\">" + formatDate (jstruct.created, "%b %e, %Y") + "</a></div>";
									}
								
								if (jstruct.subs !== undefined) {
									htmltext = renderOutlineBrowser (jstruct, false, undefined, undefined, true);
									}
								else {
									htmltext = jstruct.text;
									}
								
								htmltext = "<div class=\"divXrefOutline\">" + permalinkString + htmltext + "</div>";
								
								outlineObject = $(htmltext);
								
								$(theListItem).append (outlineObject);
								
								exposeOutlineObject ();
								
								}
							});
						}
					else {
						exposeOutlineObject ();
						}
					}
				else {
					$(outlineObject).slideUp (75);
					}
				});
			}
		});
	}
function setupSpoilers () {
	$(".spSpoiler").each (function () {
		var spoilertext = $(this).html ();
		console.log ("setupSpoilers: spoilertext == " + spoilertext);
		console.log ("setupSpoilers");
		$(this).text ("[Spoilers.]");
		$(this).css ("display", "inline");
		$(this).mousedown (function () {
			console.log ("setupSpoilers: spoilertext == " + spoilertext);
			$(this).text (spoilertext);
			});
		});
	}
function setupTagrefs () { //7/17/21 by DW
	tagrefDialogStartup ();
	}
function viewRiverPage () {
	var urlRiver = "http://radio3.io/rivers/iowa.js"; 
	var title = $("#idRiverDisplay").data ("title");
	httpGetRiver (urlRiver, "idRiverDisplay", function () {
		});
	}
function viewLinksPage (callback) {
	var urlRiver = "http://radio3.io/rivers/iowa.js"; 
	var title = $("#idRiverDisplay").data ("title");
	readHttpFile ("http://radio3.io/users/davewiner/linkblog.json", function (jsontext) {
		var daysTable = JSON.parse (jsontext);
		$("#idLinkblogDays").html ("");
		for (var i = 0; i < daysTable.length; i++) { //10/8/16 by DW
			appendDay (daysTable [i].jstruct);
			}
		if (callback != undefined) {
			callback ();
			}
		});
	}
function viewLastUpdateString () { 
	if (config.flHomePage) {
		var whenstring = getFacebookTimeString (config.now, true); //2/25/18 by DW
		if (beginsWith (whenstring, "Yesterday")) {
			whenstring = "Yesterday";
			}
		$("#idLastBlogUpdate").html ("Updated: " + whenstring + ".");
		}
	}
function updateSnarkySlogan () { //1/23/19 by DW
	$("#idSnarkySlogan").html (getRandomSnarkySlogan ());
	}
function everyMinute () {
	viewLastUpdateString ();
	updateSnarkySlogan (); //1/23/19 by DW
	}
function everySecond () {
	$(".spHowLongUntilBidenStarts").each (function () { //1/18/21 by DW
		function getTrumpTimeRemaining () {
			var whenInaugration = new Date ("Wed Jan 20 2021 11:59:59 GMT-0500 (Eastern Standard Time)");
			var now = new Date ();
			var ctsecs = (whenInaugration - now) / 1000;
			
			const ctsecsinday = 60 * 60 * 24;
			const ctsecsinhour = 60 * 60;
			var ctdays = Math.floor (ctsecs / ctsecsinday);
			ctsecs -= ctdays * ctsecsinday;
			
			var cthours = Math.floor (ctsecs / ctsecsinhour);
			ctsecs -= cthours * ctsecsinhour;
			
			var ctminutes = Math.floor (ctsecs / 60);
			ctsecs -= ctminutes * 60;
			ctsecs = Math.floor (ctsecs);
			
			var s = "";
			function addnum (num, label, fllast) {
				if (num > 0) {
					if (num == 1) {
						label = stringDelete (label, label.length, 1);
						}
					s += num + " " + label;
					if (!fllast) {
						s += ", ";
						}
					}
				}
			addnum (ctdays, "days");
			addnum (cthours, "hours");
			addnum (ctminutes, "minutes");
			addnum (ctsecs, "seconds", true);
			return (s);
			}
		$(this).text (getTrumpTimeRemaining ());
		});
	$(".spRandomMotto").each (function () { //8/7/19 by DW
		$(this).text (getRandomSnarkySlogan ());
		});
	$(".spHowLongRunning").each (function () { //8/9/19 by DW
		$(this).text ("This blog has been running for: " + howLongSinceStartAsString (new Date ("10/7/1994, 12:00 PDT")));
		});
	}
function setupJavaScriptFeatures () { //1/15/19 by DW
	setupXrefs (); //7/13/17 by DW
	setupTweets (); //7/24/17 by DW
	setupExpandableImages (); //7/24/17 by DW
	setupExpandableVideo (); //10/9/17 by DW
	setupExpandableOutline (); //5/15/18 by DW
	setupTwitterComments (); //12/14/18 by DW
	setupSpoilers (); //3/3/20 by DW
	setupTagrefs (); //7/17/21 by DW
	try { //9/21/19 by DW
		if (modalImageViewStartup !== undefined) { //6/25/18 by DW
			modalImageViewStartup (); 
			}
		}
	catch (err) {
		}
	}
function setPageTopImageFromMetadata () { //5/4/20 by DW
	if (config.metadata !== undefined) {
		if (config.metadata.image !== undefined) {
			$("#idPagetopImage").css ("background-image", "url(" + config.metadata.image + ")");
			}
		}
	}
function movePageDownForOldArchivePages () { //9/21/19 by DW
	var fladjust = !dayGreaterThanOrEqual (opmlHead.dateModified, "21 Apr 2019")
	if (fladjust) {
		$(".divPageBody").css ("margin-top", "270px")
		}
	}
function startup () {
	console.log ("startup");
	$("#idVersionNumber").text (myVersion);
	updateTwitterButton (); //4/23/19 by DW
	twStorageData.urlTwitterServer = urlLikeServer;
	twGetOauthParams (); //11/10/18 by DW
	
	//get tab param, if present, redirect to appropriate page
		var tabParam = getURLParameter ("tab");
		tabParam = (tabParam == "null") ? undefined : tabParam;
	
	startTabsIfHomePage (tabParam, function () {
		viewLastUpdateString (); //9/28/17 by DW
		updateSnarkySlogan (); //1/23/19 by DW
		setupJavaScriptFeatures ();
		setPageTopImageFromMetadata (); //5/4/20 by DW
		hitCounter ("drummer"); 
		if (config.flGoogleAnalytics) {
			initGoogleAnalytics (config.appDomain, config.idGoogleAccount); 
			}
		self.setInterval (everySecond, 1000); 
		runEveryMinute (everyMinute);
		infiniteScrollHandler (); //10/17/19 by DW
		});
	
	}
