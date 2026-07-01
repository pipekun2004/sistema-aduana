package sistema_aduana.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sistema_aduana.storage.DataStore;

import java.util.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

@PostMapping("/login")
public ResponseEntity<?> login(
        @RequestBody Map<String, String> body) {

    System.out.println("BODY = " + body);

    String usuario = body.getOrDefault(
            "usuario",
            body.get("user")
    );

    String password = body.getOrDefault(
            "password",
            body.get("pass")
    );

    Optional<Map<String, Object>> encontrado =
            DataStore.usuarios.stream()
                    .filter(u ->
                            Objects.equals(usuario, u.get("usuario")) &&
                            Objects.equals(password, u.get("password")))
                    .findFirst();

    if (encontrado.isEmpty()) {
        return ResponseEntity.status(401).body(
                Map.of(
                        "success", false,
                        "message", "Credenciales inválidas"
                )
        );
    }

    return ResponseEntity.ok(
            Map.of(
                    "success", true,
                    "token", UUID.randomUUID().toString(),
                    "usuario", encontrado.get()
            )
    );
}


    @PostMapping("/logout")
    public Map<String, Object> logout() {
        return Map.of(
                "success", true
        );
    }
}