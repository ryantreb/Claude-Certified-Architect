/***************************************************************



  This is a sample javascript file
  
  
  
***************************************************************/


/***************************************************************
 * logs an error
 **************************************************************/
function LOG_ERROR(content,className,fnName,idNum)
{
	LOGGER.ERROR(className + ".[" + fnName + "].(" + idNum + ")-" + content)	
}
/***************************************************************
 * logs a warning
 **************************************************************/
function LOG_WARN(content,className,fnName,idNum)
{
	LOGGER.WARN(className + ".[" + fnName + "].(" + idNum + ")-" + content)	
}
/***************************************************************
 * logs an info message
 **************************************************************/
function LOG_INFO(content,className,fnName,idNum)
{
	LOGGER.INFO(className + ".[" + fnName + "].(" + idNum + ")-" + content)	
}
/***************************************************************
 * logs a debug mesage
 **************************************************************/
function LOG_DEBUG(content,className,fnName,idNum)
{
	LOGGER.DEBUG(className + ".[" + fnName + "].(" + idNum + ")-" + content)		
}