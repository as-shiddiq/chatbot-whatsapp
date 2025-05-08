import chalk from 'chalk';

export const splash = async (): Promise <void> => {
    console.log(chalk.green(`             ********+++==          
           ***********++++==--       
        ##*********   ++++==-----    
       ###****             -------   
      ####**      ****+*     ------  
     #####*    *******+++==   ------ 
    ######   *********++====   ------
    #####   ******     =====-   ----:
    ####    *****       ====-    ---:
    ####    *****       ====-    ----
    #####   ******     ====--   ----:
    **##**   ++++++=========-  ------
     *****+    ++++=========-------- 
      ****++      +====  ===-------  
       ***++++             =------   
        **++++++++++ ===     ----    
          *++++++++======            
              +++++======           \n`));
      console.log(chalk.red("WhatsApp Chatbot by as-shiddiq"));
      console.log(chalk.yellow("https://github.com/as-shiddiq/chatbot-whatsapp\n"));
}
