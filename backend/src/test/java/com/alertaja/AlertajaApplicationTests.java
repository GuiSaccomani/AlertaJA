package com.alertaja;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class AlertajaApplicationTests {

	@Test
	@DisplayName("Deve carregar o contexto da aplicação com sucesso no perfil de teste")
	void contextLoads() {
	}

}
