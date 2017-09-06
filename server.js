'use strict';
// TODO add an option to restrict the  number of items to be fetched in one go

const FeedParser = require('feedparser')
const request = require('request');
const cheerio = require('cheerio');
const prompt = require("prompt");
const htmlToText = require('html-to-text');
const colors = require('colors');
const clear = require('./clear');
const mainUrl = "http://www.thehindu.com/";

let subCat = "";
let max = null;

if( typeof(process.argv[0]!=='undefined') && process.argv[2] && process.argv[2].length)
{
	let prefix = process.argv[2];

	if(prefix!=='opinion')
	{
		subCat = mainUrl +"news/"+prefix+"/"
	}
	else
	{
		subCat= mainUrl+"opinion/";
	}

}
else
{
	subCat= mainUrl;
}

if(process.argv[3])
{
	max = parseInt(process.argv[3]);
}

const feedUrl = subCat+"?service=rss";
const url =feedUrl;
const req = request(url)
const feedparser = new FeedParser();
const urls = new Map();

let $ = null;




req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36');

req.setHeader('accept', 'text/html,application/xhtml+xml');

req.on('error', function (error) 
{
  	console.log(error);
});

req.on('response', function (res) 
{
  const stream = this;

  if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

  stream.pipe(feedparser);
});


feedparser.on('error', function(error) 
{
  	console.log(error);
});
let i = 0;
feedparser.on('readable', function() 
{
  
  let stream = this, meta = this.meta, item;
  
  while (item = stream.read()) 
  {
	  	let {title,description,link} = item;
	  	urls.set(++i,link);
		// process.stdout.write is console.log sans new line character
	    process.stdout.write(title.bold.blue);process.stdout.write("  [ "+i+" ] ")

	    console.log("\n");

	    (description)&&console.log(description.italic.yellow)
		
		console.log("\n\n");

  }

});

feedparser.on('end',function()
{
	promptForPost();
})

function getNews(url)
{
	
	// let start = url.lastIndexOf("/");
	// let end = url.indexOf(".ece");
	// let articleId = url.substring(start+1,102).replace(/\D/g,'');

	request(url, function (error, response, body) 
	{
		  if (!error && response.statusCode == 200) 
		  {
				$ = cheerio.load(body);

				let textContent = '';
				let title =$('h1.title').text();
				let mainDivId = "content-body-";
				let idOFDidv = ""

				$("div.article").children().each(function()
				{
					let idString = $(this).attr("id");
					
					if(idString)
					{
						if(idString.indexOf(mainDivId)>-1)
						{
							idOFDidv = idString.trim();
						}
					}
				})
				
				$('#'+idOFDidv).each(function(){
					textContent = textContent +$(this).html()
				});
				
				
				const text = htmlToText.fromString( textContent, 
				{
					wordwrap: 230,
					preserveNewlines:true
				});
						
				console.log(title.bold.gray)
				console.log("\n");
				console.log(text.italic.black);

				promptForPost();

		}
		else{
			console.log(error)
		}
			  
	})
}

function promptForPost()
{
	prompt.start();

	let keys = [...urls.keys()];

	keys[keys.length]=0;

	keys = keys.map( v => v.toString());

	let schema = 
	{
		"properties":  
		 {
		    "post":
		     {

			 	message			: 	"Invalid input!!!! Please enter a valid post number or 0 to exit.",

			 	description		: 	"Enter post number( or  0 to exit)",

			 	enum 			: 	 keys
		 	 }
		  }
  
	}
   	prompt.get(schema,function(err,res)
   	{
   		

   		if(res.post == 0)
   		{
   			process.exit();
   		}

   		else
   		{
   			
	   		let url = urls.get(parseInt(res.post));

	   		clear();

	   		getNews(url);
	   			
   		}

   	})
}
