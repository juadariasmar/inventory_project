import uvicorn
from headroom.proxy import create_proxy_app
from headroom.config import IntelligentContextConfig, ScoringWeights
from headroom.transforms import RollingWindowConfig

# Personaliza los pesos de puntuación (deben sumar 1.0)
weights = ScoringWeights(
    recency=0.20,              # Los mensajes más nuevos puntúan más alto
    semantic_similarity=0.20,  # Similitud con el contexto reciente
    toin_importance=0.25,      # Patrones de recuperación aprendidos por TOIN
    error_indicator=0.15,      # Tipos de campos de error aprendidos por TOIN
    forward_reference=0.15,    # Mensajes referenciados por mensajes posteriores
    token_density=0.05,        # Densidad de información
)

# Configuración de Contexto Inteligente
context_config = IntelligentContextConfig(
    enabled=True,
    keep_system=True,           # Nunca descartar mensajes del sistema
    keep_last_turns=2,          # Proteger los últimos N turnos del usuario
    output_buffer_tokens=4000,  # Reserva para la salida del modelo
    use_importance_scoring=True,
    scoring_weights=weights,
    toin_integration=True,      # Usar patrones TOIN si están disponibles
    recency_decay_rate=0.1,     # Lambda de decaimiento exponencial
    compress_threshold=0.1,     # Intentar compresión primero si <10% sobre el presupuesto
)

# Configuración de respaldo (Rolling Window)
rolling_config = RollingWindowConfig(
    min_keep_turns=3,
    output_buffer_tokens=4000,
    prefer_drop_tool_outputs=True,
)

# Inicializar la aplicación proxy con las configuraciones personalizadas
app = create_proxy_app(
    context_config=context_config,
    rolling_window_config=rolling_config
)

if __name__ == "__main__":
    print("Iniciando proxy personalizado de Headroom en el puerto 8787...")
    uvicorn.run(app, host="127.0.0.1", port=8787)
