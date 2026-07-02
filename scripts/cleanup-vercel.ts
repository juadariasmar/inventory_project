import dotenv from 'dotenv'

dotenv.config()

const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID

async function cleanup() {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    console.error('[Limpieza Vercel] Error: VERCEL_TOKEN y VERCEL_PROJECT_ID son requeridos en las variables de entorno.')
    process.exit(1)
  }

  console.log('[Limpieza Vercel] Iniciando escaneo de despliegues...')

  try {
    const response = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=100`,
      {
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Error al listar despliegues: ${response.statusText} - ${errorText}`)
    }

    const data = (await response.json()) as { deployments: any[] }
    const deployments = data.deployments || []

    console.log(`[Limpieza Vercel] Se encontraron ${deployments.length} despliegues en total.`)

    const previewDeploys = deployments.filter((d) => d.target !== 'production')
    previewDeploys.sort((a, b) => b.created - a.created)

    const MAX_PREVIEWS = 10
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000
    const previewDeploysToDelete: any[] = []

    previewDeploys.forEach((deploy, index) => {
      // Conservar los 3 más nuevos incondicionalmente para evitar PRs activos sin preview
      if (index < 3) return

      // Si superamos el límite total (MAX_PREVIEWS = 10), eliminar incondicionalmente
      if (index >= MAX_PREVIEWS) {
        previewDeploysToDelete.push(deploy)
        return
      }

      // Si está en el rango intermedio pero tiene más de 48 horas, se elimina
      if (deploy.created < twoDaysAgo) {
        previewDeploysToDelete.push(deploy)
      }
    })

    const productionDeploys = deployments.filter((d) => d.target === 'production')
    productionDeploys.sort((a, b) => b.created - a.created)

    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000
    const productionDeploysToDelete: any[] = []

    productionDeploys.forEach((deploy, index) => {
      // El deploy de producción activo actual (el más nuevo) NUNCA debe ser eliminado
      if (index === 0) return

      // Los despliegues de producción históricos de más de 72 horas se eliminan
      if (deploy.created < threeDaysAgo) {
        productionDeploysToDelete.push(deploy)
      }
    })

    const toDelete = [...previewDeploysToDelete, ...productionDeploysToDelete]

    if (toDelete.length === 0) {
      console.log('[Limpieza Vercel] No hay despliegues antiguos que requieran ser eliminados.')
      return
    }

    console.log(`[Limpieza Vercel] Se eliminarán ${toDelete.length} despliegues (${previewDeploysToDelete.length} previews y ${productionDeploysToDelete.length} de producción).`)

    for (const deploy of toDelete) {
      const dateStr = new Date(deploy.created).toLocaleDateString()
      const typeStr = deploy.target === 'production' ? 'producción' : 'preview'
      console.log(`[Limpieza Vercel] Eliminando deploy (${typeStr}) ID: ${deploy.uid} (${deploy.url}) creado el ${dateStr}...`)

      const deleteRes = await fetch(
        `https://api.vercel.com/v13/deployments/${deploy.uid}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${VERCEL_TOKEN}`,
          },
        }
      )

      if (!deleteRes.ok) {
        console.error(`[Limpieza Vercel] Error al eliminar deploy ${deploy.uid}: ${deleteRes.statusText}`)
      } else {
        console.log(`[Limpieza Vercel] Deploy ${deploy.uid} eliminado exitosamente.`)
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    console.log('[Limpieza Vercel] Limpieza finalizada correctamente.')
  } catch (error) {
    console.error('[Limpieza Vercel] Ocurrió un error inesperado durante la limpieza:', error)
    process.exit(1)
  }
}

cleanup()
