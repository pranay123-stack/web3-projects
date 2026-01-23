'use client';

import React, { useState } from 'react';
import { Wallet, Plus, RefreshCw } from 'lucide-react';
import { Position } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SubHeader } from '@/components/layout/Header';
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary';
import { PositionCard } from '@/components/portfolio/PositionCard';
import { ImpermanentLossCalc } from '@/components/portfolio/ImpermanentLossCalc';
import { usePositions } from '@/hooks/usePositions';
import { useWallet } from '@/hooks/useWallet';

export default function PortfolioPage() {
  const { address, isConnected, connect } = useWallet();
  const { positions, isLoading, error, refetch } = usePositions();
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [showILCalc, setShowILCalc] = useState(false);

  // Not connected state
  if (!isConnected) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <SubHeader
          title="Portfolio"
          description="Track your liquidity positions and earnings"
        />

        <Card className="max-w-lg mx-auto text-center py-16">
          <div className="w-16 h-16 bg-cypher-yellow/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8 text-cypher-yellow" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-cypher-gray-400 mb-6">
            Connect your wallet to view your liquidity positions and track earnings
          </p>
          <Button onClick={connect} size="lg">
            Connect Wallet
          </Button>
        </Card>

        {/* IL Calculator is always available */}
        <div className="mt-8">
          <ImpermanentLossCalc />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <SubHeader
        title="Portfolio"
        description="Track your liquidity positions and earnings"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowILCalc(!showILCalc)}
            >
              IL Calculator
            </Button>
            <Button icon={<Plus className="w-4 h-4" />}>
              New Position
            </Button>
          </div>
        }
      />

      {/* Portfolio Summary */}
      <div className="mb-8">
        <PortfolioSummary />
      </div>

      {/* IL Calculator (toggleable) */}
      {showILCalc && (
        <div className="mb-8">
          <ImpermanentLossCalc />
        </div>
      )}

      {/* Positions */}
      <Card>
        <CardHeader
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
          }
        >
          <CardTitle>Your Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-cypher-border/30 rounded-lg" />
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-cypher-red mb-4">{error}</p>
              <Button onClick={refetch}>Try Again</Button>
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-cypher-card rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-cypher-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                No Positions Found
              </h3>
              <p className="text-cypher-gray-400 mb-6">
                You dont have any liquidity positions yet. Create one to start earning fees.
              </p>
              <Button icon={<Plus className="w-4 h-4" />}>
                Create Position
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {positions.map((position) => (
                <PositionCard
                  key={position.id}
                  position={position}
                  expanded={selectedPosition?.id === position.id}
                  onClick={() =>
                    setSelectedPosition(
                      selectedPosition?.id === position.id ? null : position
                    )
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
