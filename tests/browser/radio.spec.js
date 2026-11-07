import {test,expect} from '@playwright/test';
test('reordena, reproduz e compartilha a sequência em outra sessão',async({page,browser})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Adicionar Pulso da cidade'}).click();
 await page.getByRole('button',{name:'Adicionar Última luz'}).click();
 await page.getByRole('button',{name:'Subir posição 2'}).click();
 await expect(page.locator('.sequence strong')).toHaveText(['Última luz','Pulso da cidade']);
 await page.getByRole('button',{name:'Tocar sequência'}).click();
 await expect(page.getByText('No ar: Última luz')).toBeVisible();
 await expect(page.getByText('No ar: Pulso da cidade')).toBeVisible();
 await page.getByRole('button',{name:'Parar',exact:true}).click();
 await expect(page.getByText('Pronto para ouvir')).toBeVisible();
 await page.getByRole('button',{name:'Salvar sequência'}).click();
 const shared=page.getByRole('link',{name:'Abrir link compartilhável'});
 await expect(shared).toBeVisible();
 const peer=await browser.newContext();
 try{
  const other=await peer.newPage();
  await other.goto(await shared.getAttribute('href'));
  await expect(other.locator('.sequence strong')).toHaveText(['Última luz','Pulso da cidade']);
 }finally{await peer.close();}
});
test('permite navegação por teclado e remoção em tela móvel',async({page})=>{
 await page.setViewportSize({width:360,height:800});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');
 await page.keyboard.press('Tab');
 await expect(page.getByRole('link',{name:'Ir para as vinhetas'})).toBeFocused();
 await page.getByRole('button',{name:'Adicionar Neon no cais'}).press('Enter');
 await page.getByRole('button',{name:'Remover posição 1'}).press('Enter');
 await expect(page.getByText('Adicione a primeira vinheta')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(360);
});
