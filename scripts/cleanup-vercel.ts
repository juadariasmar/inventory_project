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

    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000

    const toDelete = previewDeploys.slice(3).filter((d) => d.created < twoDaysAgo)

    if (toDelete.length === 0) {
      console.log('[Limpieza Vercel] No hay despliegues de preview antiguos que requieran ser eliminados.')
      return
    }

    console.log(`[Limpieza Vercel] Se eliminarán ${toDelete.length} despliegues de preview antiguos.`)

    for (const deploy of toDelete) {
      const dateStr = new Date(deploy.created).toLocaleDateString()
      console.log(`[Limpieza Vercel] Eliminando deploy ID: ${deploy.uid} (${deploy.url}) creado el ${dateStr}...`)

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
