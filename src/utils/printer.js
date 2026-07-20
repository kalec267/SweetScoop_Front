export const PrinterService = {
  // 💡 비동기 처리를 위해 async 추가
  async printReceipt(receiptData) {
    if (!receiptData) {
      console.warn('====== [HARDWARE DRIVER] 영수증 데이터가 유효하지 않습니다. ======');
      return;
    }

    // 1. 기존 로그 출력 로직 유지
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

    if (receiptData.items && Array.isArray(receiptData.items)) {
      receiptData.items.forEach(item => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        console.log(`${item.menuName || '이름 없음'} x ${quantity} : ${price.toLocaleString()}원`);
        
        // 영수증 문자열 생성
        const name = (item.menuName || '상품').padEnd(14, " ").substring(0, 14);
        receiptContent += `${name} x${quantity}  ${price.toLocaleString()}원\n`;
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

    // 2. 물리 프린터 SDK 연동 (기존 코드)
    if (window.KioskPrinterSDK) {
      window.KioskPrinterSDK.printText(`호출대기번호: ${receiptData.waitingNo || 'N/A'}\n`);
      window.KioskPrinterSDK.cutPaper();
    }

    // 3. 서버 전송 로직 추가 (172.16.15.97:77777/receipt)
    try {
      const response = await fetch('http://localhost:8888/api/printer/print', {  
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNo: receiptData.orderId,
          orderItem: receiptData.items[0]?.menuName || '상품명',
          price: receiptData.totalPrice.toLocaleString() + "원",
          orderDate: receiptData.orderTime
          }) // 서버가 'content' 키를 받는다고 가정
      });
      
      if (response.ok) {
        console.log('====== [HARDWARE DRIVER] 네트워크 프린터 전송 성공 ======');
      }
    } catch (err) {
      console.error('====== [HARDWARE DRIVER] 네트워크 프린터 전송 실패 ======');
    }
  }
};