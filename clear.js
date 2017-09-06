module.exports = function clear(clear)
{
	if (clear !== false) 
	{
    	process.stdout.write("\033[2J"); //move cursor to the top left
  	}

  	process.stdout.write("\033[0f");//clears text from the screen 
}