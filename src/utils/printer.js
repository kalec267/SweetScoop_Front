// src/utils/printer.js
export const PrinterService = {
  formatOptions(options) {
    if (!options) return '';
    if (Array.isArray(options)) {
      return options.map(opt => (typeof opt === 'object' && opt !== null ? (opt.name || opt.label || '') : opt)).join(', ');
    }
    if (typeof options === 'object') {
      return options.name || options.label || JSON.stringify(options);
    }
    return String(options);
  },

  async printReceipt(receiptData) {
    if (!receiptData) {
      console.warn('====== [HARDWARE DRIVER] 영수증 데이터가 유효하지 않습니다. ======');
      return;
    }

    console.log('====== [HARDWARE DRIVER] 영수증 출력 가동 ======');
    console.log(`내부 매핑 주문ID : ${receiptData.orderId || 'N/A'}`);
    console.log(`통합 영수증 번호 : ${receiptData.receiptNo || 'N/A'}`);
    console.log(`▶▶ [고객 호출 번호] : ${receiptData.waitingNo || 'N/A'}번`);
    console.log(`결제 승인 수단  : ${receiptData.paymentMethod || '미지정'} (${receiptData.cardCompany || '신용카드'})`);
    
    console.log('--- 주문 상세 ---');
    let receiptContent = "      [ 영 수 증 ]\n================================\n";
    receiptContent += `주문번호 : ${receiptData.orderId || 'N/A'}\n`;
    receiptContent += `영수증번호 : ${receiptData.receiptNo || 'N/A'}\n`;
    receiptContent += `주문시각 : ${receiptData.orderTime || 'N/A'}\n--------------------------------\n`;

    let fullItemsDescription = [];

    if (receiptData.items && Array.isArray(receiptData.items)) {
      receiptData.items.forEach(item => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        const itemTotal = price * quantity;
        
        const flavorsStr = item.flavors || '';
        const optionsStr = item.options || '';

        // 콘솔 출력
        console.log(`${item.menuName} x ${quantity} = ${itemTotal.toLocaleString()}원`);
        if (flavorsStr) console.log(`  └ 맛: ${flavorsStr}`);
        if (optionsStr) console.log(`  └ 옵션: ${optionsStr}`);
        
        // 영수증 텍스트 문자열 생성
        receiptContent += `${item.menuName} x${quantity} = ${itemTotal.toLocaleString()}원\n`;
        if (flavorsStr) receiptContent += `  - 맛: ${flavorsStr}\n`;
        if (optionsStr) receiptContent += `  - 옵션: ${optionsStr}\n`;

        // 서버 전송용 요약 데이터 생성
        let itemDesc = `${item.menuName} x${quantity}`;
        let details = [];
        if (flavorsStr) details.push(`맛: ${flavorsStr}`);
        if (optionsStr) details.push(`옵션: ${optionsStr}`);
        if (details.length > 0) {
          itemDesc += ` (${details.join(' / ')})`;
        }
        fullItemsDescription.push(itemDesc);
      });
    }
    
    const totalPrice = Number(receiptData.totalPrice) || 0;
    console.log(`최종 결제 금액  : ${totalPrice.toLocaleString()}원`);
    console.log(`주문 발생 시각  : ${receiptData.orderTime || new Date().toLocaleString()}`);
    console.log('================================================');

    receiptContent += "--------------------------------\n";
    receiptContent += `합계 금액 : ${totalPrice.toLocaleString()}원\n`;
    receiptContent += "================================\n";
    receiptContent += `고객 호출 번호 : ${receiptData.waitingNo || 'N/A'}번\n\n\n`;

    if (window.KioskPrinterSDK) {
      window.KioskPrinterSDK.printText(`호출대기번호: ${receiptData.waitingNo || 'N/A'}\n`);
      window.KioskPrinterSDK.cutPaper();
    }

    try {
      const response = await fetch('/api/printer/print', {  
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNo: receiptData.orderId,
          orderItem: fullItemsDescription.join(', ') || '상품명',
          price: receiptData.totalPrice.toLocaleString() + "원",
          orderDate: receiptData.orderTime
        })
      });
      
      if (response.ok) {
        console.log('====== [HARDWARE DRIVER] 네트워크 프린터 전송 성공 ======');
      }
    } catch (err) {
      console.error('====== [HARDWARE DRIVER] 네트워크 프린터 전송 실패 ======');
    }
  }
};